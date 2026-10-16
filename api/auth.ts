import { createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request, Response, RequestHandler } from "express";
import type { Pool } from "pg";
import { z } from "zod";

import { inTransaction } from "./database";

const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const codeSchema = z.string().regex(/^\d{6}$/);
const cookieName = "fixhub_session";
const csrfCookieName = "fixhub_csrf";
const challengeLifetimeMs = 10 * 60 * 1000;
const sessionLifetimeSeconds = 60 * 60 * 24 * 14;

export type AuthConfig = {
  hmacSecret: string;
  production: boolean;
  webOrigins: string[];
};

export type EmailSender = (email: string, code: string) => Promise<void>;

export function authConfigFromEnvironment(environment: NodeJS.ProcessEnv): AuthConfig | null {
  const secret = environment.AUTH_HMAC_SECRET;
  if (!secret) return null;
  if (Buffer.byteLength(secret, "utf8") < 32 || !secret.trim()) throw new Error("AUTH_HMAC_SECRET must contain at least 32 non-whitespace bytes");
  const webOrigins = (environment.FIXHUB_WEB_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  return { hmacSecret: secret, production: environment.NODE_ENV === "production", webOrigins };
}

function digest(secret: string, purpose: string, value: string): Buffer {
  return createHmac("sha256", secret).update(`${purpose}\0${value}`).digest();
}

function equalDigest(expected: Buffer, actual: Buffer): boolean {
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function readCookie(request: Request, name: string): string | undefined {
  const prefix = `${name}=`;
  for (const part of (request.headers.cookie ?? "").split(";")) {
    const item = part.trim();
    if (item.startsWith(prefix)) {
      try { return decodeURIComponent(item.slice(prefix.length)); } catch { return undefined; }
    }
  }
  return undefined;
}

function setAuthCookies(response: Response, sessionToken: string, csrfToken: string, production: boolean) {
  const secure = production ? "; Secure" : "";
  const sessionName = production ? `__Host-${cookieName}` : cookieName;
  const csrfName = production ? `__Host-${csrfCookieName}` : csrfCookieName;
  response.append("Set-Cookie", `${sessionName}=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionLifetimeSeconds}${secure}`);
  response.append("Set-Cookie", `${csrfName}=${encodeURIComponent(csrfToken)}; Path=/; SameSite=Lax; Max-Age=${sessionLifetimeSeconds}${secure}`);
}

function clearAuthCookies(response: Response, production: boolean) {
  const secure = production ? "; Secure" : "";
  const sessionName = production ? `__Host-${cookieName}` : cookieName;
  const csrfName = production ? `__Host-${csrfCookieName}` : csrfCookieName;
  response.append("Set-Cookie", `${sessionName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
  response.append("Set-Cookie", `${csrfName}=; Path=/; SameSite=Lax; Max-Age=0${secure}`);
}

export function createAuthHandlers(pool: Pick<Pool, "connect">, config: AuthConfig, sendEmail: EmailSender) {
  async function requestCode(request: Request, response: Response) {
    const parsed = z.object({ email: emailSchema }).strict().safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: { code: "INVALID_INPUT", message: "Enter a valid email address." } });

    const email = parsed.data.email;
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const challengeId = randomUUID();
    const issuedAt = new Date();
    const expiresAt = new Date(issuedAt.getTime() + challengeLifetimeMs);
    const codeHmac = digest(config.hmacSecret, `login-code:${challengeId}:${email}`, code);

    let rateLimited = false;
    await pool.connect().then(async (client) => {
      let released = false;
      try {
        await client.query("BEGIN");
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`fixhub-login:${email}`]);
        const recent = await client.query<{ count: string }>(
          "SELECT count(*)::text AS count FROM email_login_challenge WHERE email_normalized = $1 AND issued_at > clock_timestamp() - interval '1 hour'",
          [email],
        );
        if (Number(recent.rows[0]?.count ?? 0) >= 5) {
          await client.query("ROLLBACK");
          rateLimited = true;
          return;
        }
        await client.query(
          "INSERT INTO email_login_challenge (id, email_normalized, code_hmac, issued_at, expires_at) VALUES ($1, $2, $3, $4, $5)",
          [challengeId, email, codeHmac, issuedAt, expiresAt],
        );
        await client.query("COMMIT");
      } catch (error) {
        try { await client.query("ROLLBACK"); } catch { client.release(true); released = true; throw error; }
        throw error;
      } finally {
        // release(true) is used only when rollback fails; callers never inspect pg internals.
        if (!released) client.release();
      }
    });
    if (rateLimited) return response.status(429).json({ error: { code: "RATE_LIMITED", message: "Too many sign-in attempts. Please try again later." } });

    try {
      await sendEmail(email, code);
    } catch {
      await pool.connect().then(async (client) => {
        try {
          await client.query("UPDATE email_login_challenge SET consumed_at = clock_timestamp() WHERE id = $1 AND consumed_at IS NULL", [challengeId]);
        } finally { client.release(); }
      });
      return response.status(503).json({ error: { code: "DELIVERY_UNAVAILABLE", message: "Sign-in email could not be sent. Please try again later." } });
    }
    return response.status(202).json({ message: "If this address can receive sign-in messages, a code has been sent." });
  }

  async function verifyCode(request: Request, response: Response) {
    const parsed = z.object({ email: emailSchema, code: codeSchema }).strict().safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: { code: "INVALID_INPUT", message: "Enter a valid email and six-digit code." } });
    const { email, code } = parsed.data;
    const client = await pool.connect();
    let released = false;
    let token: string | undefined;
    let csrf: string | undefined;
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`fixhub-login:${email}`]);
      const challenges = await client.query<{ id: string; code_hmac: Buffer; attempt_count: number }>(
        `SELECT id, code_hmac, attempt_count FROM email_login_challenge
         WHERE email_normalized = $1 AND consumed_at IS NULL AND expires_at > clock_timestamp() AND attempt_count < 5
         ORDER BY issued_at DESC LIMIT 5 FOR UPDATE`,
        [email],
      );
      if (!challenges.rows.length) {
        await client.query("ROLLBACK");
        return response.status(401).json({ error: { code: "INVALID_CODE", message: "The code is invalid or expired." } });
      }
      const matchingChallenge = challenges.rows.find((challenge) =>
        equalDigest(challenge.code_hmac, digest(config.hmacSecret, `login-code:${challenge.id}:${email}`, code)),
      );
      if (!matchingChallenge) {
        await client.query(
          `UPDATE email_login_challenge
           SET attempt_count = LEAST(attempt_count + 1, 5),
               consumed_at = CASE WHEN attempt_count >= 4 THEN clock_timestamp() ELSE consumed_at END
           WHERE email_normalized = $1 AND consumed_at IS NULL AND expires_at > clock_timestamp()`,
          [email],
        );
        await client.query("COMMIT");
        return response.status(401).json({ error: { code: "INVALID_CODE", message: "The code is invalid or expired." } });
      }

      // Multiple concurrent email sends can arrive out of order. Accept any live code,
      // then consume every outstanding challenge after a successful verification.
      await client.query(
        "UPDATE email_login_challenge SET consumed_at = clock_timestamp() WHERE email_normalized = $1 AND consumed_at IS NULL",
        [email],
      );
      const subject = await client.query<{ id: string }>(
        `INSERT INTO identity_subject (id, email_normalized, email_verified_at)
         VALUES ($1, $2, clock_timestamp())
         ON CONFLICT (email_normalized) DO UPDATE SET email_verified_at = COALESCE(identity_subject.email_verified_at, clock_timestamp()), updated_at = clock_timestamp()
         WHERE identity_subject.status = 'active'
         RETURNING id`,
        [randomUUID(), email],
      );
      if (!subject.rows.length) {
        await client.query("ROLLBACK");
        return response.status(403).json({ error: { code: "ACCOUNT_UNAVAILABLE", message: "This account cannot sign in." } });
      }
      await client.query(
        "INSERT INTO identity_role (subject_id, role) VALUES ($1, 'customer') ON CONFLICT DO NOTHING",
        [subject.rows[0].id],
      );

      token = randomBytes(32).toString("base64url");
      csrf = randomBytes(32).toString("base64url");
      await client.query(
        `INSERT INTO identity_session (id, subject_id, token_hmac, csrf_hmac, expires_at)
         VALUES ($1, $2, $3, $4, clock_timestamp() + interval '14 days')`,
        [randomUUID(), subject.rows[0].id, digest(config.hmacSecret, "session", token), digest(config.hmacSecret, "csrf", csrf)],
      );
      await client.query("COMMIT");
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { client.release(true); released = true; throw error; }
      throw error;
    } finally {
      if (!released) client.release();
    }

    setAuthCookies(response, token!, csrf!, config.production);
    return response.status(200).json({ authenticated: true, role: "customer" });
  }

  const requireSession: RequestHandler = async (request, response, next) => {
    const token = readCookie(request, config.production ? `__Host-${cookieName}` : cookieName);
    const csrfCookie = readCookie(request, config.production ? `__Host-${csrfCookieName}` : csrfCookieName);
    const csrfHeader = request.get("x-csrf-token");
    const safeMethod = request.method === "GET" || request.method === "HEAD";
    if (!token || !csrfCookie || (!safeMethod && (!csrfHeader || csrfCookie !== csrfHeader))) {
      clearAuthCookies(response, config.production);
      return response.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
    }
    const client = await pool.connect();
    try {
      const result = await client.query<{ subject_id: string; roles: string[] }>(
        `SELECT s.subject_id,
                array_agg(r.role ORDER BY r.role) AS roles
         FROM identity_session s
         JOIN identity_subject u ON u.id = s.subject_id AND u.status = 'active'
         JOIN identity_role r ON r.subject_id = s.subject_id
         WHERE s.token_hmac = $1 AND s.csrf_hmac = $2
           AND s.revoked_at IS NULL AND s.expires_at > clock_timestamp()
         GROUP BY s.subject_id`,
        [digest(config.hmacSecret, "session", token), digest(config.hmacSecret, "csrf", csrfCookie)],
      );
      if (!result.rows.length) {
        clearAuthCookies(response, config.production);
        return response.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Sign in to continue." } });
      }
      response.locals.auth = { subjectId: result.rows[0].subject_id, roles: result.rows[0].roles };
      next();
    } catch (error) { next(error); }
    finally { client.release(); }
  };

  async function logout(request: Request, response: Response) {
    const token = readCookie(request, config.production ? `__Host-${cookieName}` : cookieName);
    if (token) {
      const client = await pool.connect();
      try {
        await client.query("UPDATE identity_session SET revoked_at = clock_timestamp() WHERE token_hmac = $1 AND revoked_at IS NULL", [digest(config.hmacSecret, "session", token)]);
      } finally { client.release(); }
    }
    clearAuthCookies(response, config.production);
    return response.status(204).end();
  }

  async function requestAccountDeletion(request: Request, response: Response) {
    const parsed = z.object({ confirm: z.literal(true) }).strict().safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ error: { code: "CONFIRMATION_REQUIRED", message: "Confirm that you want to request account deletion." } });
    const auth = response.locals.auth as { subjectId?: unknown; roles?: unknown } | undefined;
    if (typeof auth?.subjectId !== "string" || !Array.isArray(auth.roles) || !auth.roles.includes("customer") || auth.roles.some((role) => role !== "customer")) {
      return response.status(403).json({ error: { code: "ACTION_DENIED", message: "This account must use the appropriate privacy-support process." } });
    }
    const subjectId = auth.subjectId;
    const privacyRequest = await inTransaction(pool, async (client) => {
      await client.query("SELECT id FROM identity_subject WHERE id = $1 FOR UPDATE", [subjectId]);
      const existing = await client.query<{ id: string; status: string }>(
        `SELECT id, status FROM privacy_request
         WHERE subject_id = $1 AND kind = 'account_deletion' AND status IN ('requested', 'under_review')`,
        [subjectId],
      );
      const requestId = existing.rows[0]?.id ?? (await client.query<{ id: string }>(
          "INSERT INTO privacy_request (id, subject_id, kind) VALUES ($1, $2, 'account_deletion') RETURNING id",
          [randomUUID(), subjectId],
        )).rows[0].id;
      await client.query("UPDATE identity_subject SET status = 'deletion_pending', updated_at = clock_timestamp() WHERE id = $1 AND status = 'active'", [subjectId]);
      await client.query("UPDATE identity_session SET revoked_at = clock_timestamp() WHERE subject_id = $1 AND revoked_at IS NULL", [subjectId]);
      return { id: requestId, status: existing.rows[0]?.status ?? "requested" };
    });
    clearAuthCookies(response, config.production);
    return response.status(202).json({
      requestId: privacyRequest.id,
      status: privacyRequest.status,
      message: "The deletion request is recorded and access is disabled. This is not confirmation that all records have been deleted; retention and legal holds must be reviewed.",
    });
  }

  return { requestCode, verifyCode, requireSession, logout, requestAccountDeletion };
}
