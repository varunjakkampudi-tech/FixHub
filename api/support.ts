import { createHash, randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import type { Pool } from "pg";
import { z } from "zod";
import { inTransaction } from "./database";

const messageCharacters = /^[^\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]*$/u;
const input = z
  .object({
    subject: z
      .string()
      .trim()
      .min(3)
      .max(120)
      .regex(/^[^\u0000-\u001f\u007f-\u009f]+$/u),
    message: z.string().trim().min(10).max(2000).regex(messageCharacters),
    bookingId: z.string().uuid().optional(),
  })
  .strict();
const replyInput = z
  .object({
    response: z.string().trim().min(5).max(2000).regex(messageCharacters),
    status: z.enum(["open", "in_review", "resolved"]),
    expectedVersion: z.number().int().min(0).max(2_147_483_646),
  })
  .strict();
const cursorInput = z
  .object({ at: z.string().datetime({ offset: true }), id: z.string().uuid() })
  .strict();
const listInput = z
  .object({
    cursor: z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,180}$/)
      .optional(),
    view: z.enum(["active", "all"]).optional(),
  })
  .strict();
const fields =
  "id, booking_id, subject, description, status, response_text, version, created_at, updated_at";
const pageSize = 25;
type TicketRow = { id: string; created_at: Date | string; [key: string]: unknown };

function actor(response: Response): string {
  return response.locals.auth.subjectId as string;
}
function invalid(response: Response) {
  return response
    .status(400)
    .json({ error: { code: "INVALID_INPUT", message: "Check the support request fields." } });
}

export function createSupportHandlers(pool: Pick<Pool, "connect">) {
  async function create(request: Request, response: Response) {
    const parsed = input.safeParse(request.body);
    const key = request.get("Idempotency-Key");
    if (!parsed.success || !key || !/^[A-Za-z0-9._:-]{16,128}$/.test(key)) return invalid(response);
    const owner = actor(response);
    const payload = {
      subject: parsed.data.subject,
      message: parsed.data.message,
      bookingId: parsed.data.bookingId ?? null,
    };
    const hash = createHash("sha256").update(JSON.stringify(payload)).digest();
    const result = await inTransaction(pool, async (client) => {
      // Serialize creation against account deletion; do not create new private records for an inactive identity.
      const identity = await client.query<{ status: string }>(
        "SELECT status FROM identity_subject WHERE id = $1 FOR SHARE",
        [owner],
      );
      if (identity.rows[0]?.status !== "active")
        return {
          status: 403,
          body: {
            error: {
              code: "ACCOUNT_UNAVAILABLE",
              message: "This account cannot submit support requests.",
            },
          },
        };
      if (payload.bookingId) {
        const booking = await client.query(
          "SELECT id FROM service_booking WHERE id = $1 AND (customer_id = $2 OR merchant_id = $2) FOR SHARE",
          [payload.bookingId, owner],
        );
        if (!booking.rows.length)
          return {
            status: 404,
            body: {
              error: {
                code: "BOOKING_NOT_FOUND",
                message: "Choose a booking belonging to your account.",
              },
            },
          };
      }
      const inserted = await client.query(
        `INSERT INTO support_ticket (id, subject_id, booking_id, subject, description, idempotency_key, request_hash)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (subject_id, idempotency_key) DO NOTHING RETURNING ${fields}`,
        [randomUUID(), owner, payload.bookingId, payload.subject, payload.message, key, hash],
      );
      if (inserted.rows.length) return { status: 201, body: { ticket: inserted.rows[0] } };
      const previous = await client.query(
        `SELECT ${fields}, request_hash FROM support_ticket WHERE subject_id = $1 AND idempotency_key = $2`,
        [owner, key],
      );
      const row = previous.rows[0];
      if (!row || !Buffer.isBuffer(row.request_hash) || !row.request_hash.equals(hash))
        return {
          status: 409,
          body: {
            error: {
              code: "IDEMPOTENCY_KEY_REUSED",
              message: "This retry key belongs to different request details.",
            },
          },
        };
      const { request_hash: _hash, ...ticket } = row;
      return { status: 200, body: { ticket } };
    });
    response.setHeader("Cache-Control", "no-store");
    return response.status(result.status).json(result.body);
  }

  async function list(request: Request, response: Response, staff: boolean) {
    const parsed = listInput.safeParse(request.query);
    if (!parsed.success) return invalid(response);
    let cursor: z.infer<typeof cursorInput> | null = null;
    if (parsed.data.cursor) {
      try {
        cursor = cursorInput.parse(
          JSON.parse(Buffer.from(parsed.data.cursor, "base64url").toString("utf8")),
        );
      } catch {
        return invalid(response);
      }
    }
    const client = await pool.connect();
    try {
      const result = await client.query<TicketRow>(
        `SELECT ${fields} FROM support_ticket
         WHERE ($1::uuid IS NULL OR subject_id = $1) AND ($2::boolean OR status <> 'resolved')
           AND ($3::timestamptz IS NULL OR (created_at, id) < ($3::timestamptz, $4::uuid))
         ORDER BY created_at DESC, id DESC LIMIT 26`,
        [
          staff ? null : actor(response),
          !staff || parsed.data.view === "all",
          cursor?.at ?? null,
          cursor?.id ?? null,
        ],
      );
      const items = result.rows.slice(0, pageSize);
      const last = items.at(-1);
      const nextCursor =
        result.rows.length > pageSize && last
          ? Buffer.from(
              JSON.stringify({ at: new Date(last.created_at).toISOString(), id: last.id }),
            ).toString("base64url")
          : null;
      response.setHeader("Cache-Control", "no-store");
      return response.status(200).json({ items, nextCursor });
    } finally {
      client.release();
    }
  }

  async function respond(request: Request, response: Response) {
    const id = z.string().uuid().safeParse(request.params.id);
    const parsed = replyInput.safeParse(request.body);
    if (!id.success || !parsed.success) return invalid(response);
    const result = await inTransaction(pool, async (client) => {
      const updated = await client.query(
        `UPDATE support_ticket SET response_text = $2, status = $3, responded_by = $4,
           version = version + 1, updated_at = clock_timestamp()
         WHERE id = $1 AND version = $5 RETURNING ${fields}`,
        [
          id.data,
          parsed.data.response,
          parsed.data.status,
          actor(response),
          parsed.data.expectedVersion,
        ],
      );
      if (!updated.rows.length) return null;
      await client.query(
        "INSERT INTO support_ticket_response (id, ticket_id, author_id, response_text, status, version) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          randomUUID(),
          id.data,
          actor(response),
          parsed.data.response,
          parsed.data.status,
          updated.rows[0].version,
        ],
      );
      return updated.rows[0];
    });
    response.setHeader("Cache-Control", "no-store");
    if (!result)
      return response.status(409).json({
        error: {
          code: "SUPPORT_VERSION_CONFLICT",
          message: "This request changed or is unavailable. Refresh before replying.",
        },
      });
    return response.status(200).json({ ticket: result });
  }
  return {
    create,
    listMine: (req: Request, res: Response) => list(req, res, false),
    listInbox: (req: Request, res: Response) => list(req, res, true),
    respond,
  };
}
