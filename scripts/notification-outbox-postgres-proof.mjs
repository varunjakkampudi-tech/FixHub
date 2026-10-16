#!/usr/bin/env node
// Safe, isolated PostgreSQL proof for migrations, the notification outbox and private support routes.
// Usage: node scripts/notification-outbox-postgres-proof.mjs --pg-bin <existing PostgreSQL bin directory>
// Uses a new loopback-only temporary cluster, synthetic records, and a fake sender.

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { access, mkdtemp, realpath, rm } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";

import { Pool } from "pg";

import { applyMigrations } from "../api/migrations.ts";
import { createNotificationOutboxDispatcher } from "../api/notification-outbox.ts";
import { encryptPhone, phoneLookupHmac, transactionalWhatsappPolicyVersion } from "../api/whatsapp-contact.ts";
import { verifySupportRequests } from "./support-postgres-cases.mjs";

const args = process.argv.slice(2);
assert.equal(args.length, 2, "Usage: node scripts/notification-outbox-postgres-proof.mjs --pg-bin <existing PostgreSQL bin directory>");
assert.equal(args[0], "--pg-bin");
const pgBin = path.resolve(args[1]);
const executable = (name) => path.join(pgBin, `${name}${process.platform === "win32" ? ".exe" : ""}`);
for (const name of ["initdb", "pg_ctl"]) await access(executable(name));

const temporaryParent = await realpath(os.tmpdir());
const temporaryRoot = await mkdtemp(path.join(temporaryParent, "fixhub-whatsapp-outbox-proof-"));
const clusterPath = path.join(temporaryRoot, "cluster");
const postgresLog = path.join(temporaryRoot, "postgres.log");
let clusterMayBeRunning = false;
let interrupted = false;
let releaseFakeSend;
const children = new Set();

function interrupt() {
  interrupted = true;
  releaseFakeSend?.();
  for (const child of children) child.kill();
}
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);

function run(command, commandArgs, { quiet = false, timeoutMs = 30_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      windowsHide: true,
      stdio: quiet ? "ignore" : ["ignore", "pipe", "pipe"],
    });
    children.add(child);
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timeout = setTimeout(() => child.kill(), timeoutMs);
    const finish = (result) => {
      if (settled) return;
      settled = true;
      children.delete(child);
      clearTimeout(timeout);
      resolve(result);
    };
    if (!quiet) {
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
    }
    child.once("error", (error) => {
      if (settled) return;
      settled = true;
      children.delete(child);
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code) => finish({ code, stdout, stderr }));
  });
}

async function checked(command, commandArgs, options) {
  const result = await run(command, commandArgs, options);
  if (result.code !== 0) throw new Error(`${path.basename(command)} exited ${result.code}: ${result.stderr.slice(-3000)}`);
  return result;
}

async function availableLoopbackPort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.once("error", reject).listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

let pool;
try {
  const port = await availableLoopbackPort();
  await checked(executable("initdb"), ["-D", clusterPath, "-U", "fixhub_proof", "--auth=trust", "--no-locale", "-E", "UTF8"]);
  clusterMayBeRunning = true;
  await checked(executable("pg_ctl"), [
    "-D", clusterPath,
    "-l", postgresLog,
    "-o", `-h 127.0.0.1 -p ${port} -c max_connections=30`,
    "-w", "-t", "20", "start",
  ], { quiet: true, timeoutMs: 25_000 });
  if (interrupted) throw new Error("Proof interrupted before database setup");

  pool = new Pool({
    host: "127.0.0.1",
    port,
    user: "fixhub_proof",
    database: "postgres",
    max: 10,
    application_name: "fixhub-notification-proof",
    connectionTimeoutMillis: 3_000,
  });

  const applied = await applyMigrations(pool);
  assert.equal(applied.length, 8, "A fresh cluster must apply all eight migrations");
  assert.deepEqual(await applyMigrations(pool), [], "A second migration run must be idempotent");
  const providerAttemptColumn = await pool.query(
    "SELECT count(*)::int AS count FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
    ["transactional_outbox", "provider_attempt_started_at"],
  );
  assert.equal(providerAttemptColumn.rows[0].count, 1);
  const statusConstraint = await pool.query(
    "SELECT pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conname = $1",
    ["transactional_outbox_status_check"],
  );
  assert.match(statusConstraint.rows[0]?.definition ?? "", /uncertain/);

  const key = Buffer.alloc(32, 71);
  const hmacSecret = "temporary-proof-only-secret-material";
  const customerId = "00000000-0000-4000-8000-000000000101";
  const merchantId = "00000000-0000-4000-8000-000000000102";
  const bookingId = "00000000-0000-4000-8000-000000000103";
  const addressId = "00000000-0000-4000-8000-000000000104";
  const offerId = "00000000-0000-4000-8000-000000000105";
  const staleCustomerId = "00000000-0000-4000-8000-000000000106";
  const staleBookingId = "00000000-0000-4000-8000-000000000107";
  const staleAddressId = "00000000-0000-4000-8000-000000000108";
  const foreignAddressBookingId = "00000000-0000-4000-8000-000000000109";
  const secondMerchantId = "00000000-0000-4000-8000-000000000110";
  const secondOfferId = "00000000-0000-4000-8000-000000000111";
  const customerPhone = "+919876543211";
  const merchantPhone = "+919876543212";
  const secondMerchantPhone = "+919876543214";
  const sent = [];
  let releaseSend;
  let signalSend;
  let pauseFirst = true;
  const sendStarted = new Promise((resolve) => { signalSend = resolve; });
  const sendGate = new Promise((resolve) => { releaseSend = resolve; releaseFakeSend = resolve; });
  const dispatcher = createNotificationOutboxDispatcher(pool, key, async (phone, variables) => {
    sent.push({ phone, variables });
    if (pauseFirst) {
      pauseFirst = false;
      signalSend();
      await sendGate;
    }
    return { messageSid: `SM${"a".repeat(32)}`, status: "queued" };
  });

  async function addIdentity(id, email, phone) {
    await pool.query(
      "INSERT INTO identity_subject (id, email_normalized, display_name) VALUES ($1, $2, $3)",
      [id, email, "Proof User"],
    );
    const encrypted = encryptPhone(phone, id, key);
    await pool.query(
      `INSERT INTO whatsapp_contact
       (subject_id, phone_ciphertext, phone_iv, phone_auth_tag, phone_hmac, phone_last_four,
        phone_verified_at, consent_granted_at, consent_policy_version)
       VALUES ($1, $2, $3, $4, $5, $6, clock_timestamp(), clock_timestamp(), $7)`,
      [id, encrypted.ciphertext, encrypted.iv, encrypted.authTag,
        phoneLookupHmac(hmacSecret, phone), phone.slice(-4), transactionalWhatsappPolicyVersion],
    );
  }

  await addIdentity(customerId, "proof.customer@example.invalid", customerPhone);
  await addIdentity(merchantId, "proof.merchant@example.invalid", merchantPhone);
  await addIdentity(staleCustomerId, "proof.stale@example.invalid", "+919876543213");
  await addIdentity(secondMerchantId, "proof.merchant2@example.invalid", secondMerchantPhone);
  await pool.query(
    "INSERT INTO merchant_profile (subject_id, business_name, verification_status, accepting_jobs) VALUES ($1, $2, $3, $4)",
    [merchantId, "Proof Merchant", "verified", true],
  );
  await pool.query(
    "INSERT INTO merchant_profile (subject_id, business_name, verification_status, accepting_jobs) VALUES ($1, $2, $3, $4)",
    [secondMerchantId, "Proof Merchant Two", "verified", true],
  );
  await pool.query(
    "INSERT INTO customer_address (id, customer_id, label, address_text, locality) VALUES ($1, $2, $3, $4, $5)",
    [addressId, customerId, "home", "12 Proof Road", "Tanuku"],
  );
  await pool.query(
    `INSERT INTO service_booking
     (id, customer_id, service_id, address_id, status, visit_price_paise, labor_estimate_paise)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [bookingId, customerId, "10000000-0000-4000-8000-000000000002", addressId, "offered", 10_000, 20_000],
  );
  await pool.query(
    `INSERT INTO booking_offer (id, booking_id, merchant_id, visit_price_paise, labor_price_paise, expires_at)
     VALUES ($1, $2, $3, $4, $5, clock_timestamp() + $6::interval)`,
    [offerId, bookingId, merchantId, 10_000, 20_000, "1 hour"],
  );
  await pool.query(
    `INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key, available_at)
     VALUES ($1, $2, $3, $4::jsonb, $5, clock_timestamp() - $6::interval)`,
    [randomUUID(), "request.created", bookingId, "{}", "proof-request-created", "2 seconds"],
  );
  await pool.query(
    `INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key, available_at)
     VALUES ($1, $2, $3, $4::jsonb, $5, clock_timestamp() - $6::interval)`,
    [randomUUID(), "merchant.booking_offer", bookingId, JSON.stringify({ bookingId, merchantId, offerId }), "proof-merchant-offer", "1 second"],
  );
  await pool.query(
    `INSERT INTO booking_offer (id, booking_id, merchant_id, visit_price_paise, labor_price_paise, expires_at)
     VALUES ($1, $2, $3, $4, $5, clock_timestamp() + $6::interval)`,
    [secondOfferId, bookingId, secondMerchantId, 12_000, 18_000, "1 hour"],
  );
  await pool.query(
    `INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key)
     VALUES ($1, 'merchant.booking_offer', $2, $3::jsonb, $4)`,
    [randomUUID(), bookingId, JSON.stringify({ bookingId, merchantId: secondMerchantId, offerId: secondOfferId }), "proof-merchant-offer-two"],
  );
  await pool.query(
    "INSERT INTO customer_address (id, customer_id, label, address_text, locality) VALUES ($1, $2, $3, $4, $5)",
    [staleAddressId, staleCustomerId, "home", "13 Proof Road", "Tanuku"],
  );
  await pool.query(
    `INSERT INTO service_booking
     (id, customer_id, service_id, address_id, status, visit_price_paise, labor_estimate_paise)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [staleBookingId, staleCustomerId, "10000000-0000-4000-8000-000000000002", staleAddressId, "accepted", 10_000, 20_000],
  );
  await pool.query(
    "INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key) VALUES ($1, $2, $3, $4::jsonb, $5)",
    [randomUUID(), "request.created", staleBookingId, "{}", "proof-stale-request"],
  );
  await pool.query(
    `INSERT INTO service_booking
     (id, customer_id, service_id, address_id, status, visit_price_paise, labor_estimate_paise)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [foreignAddressBookingId, staleCustomerId, "10000000-0000-4000-8000-000000000002", addressId, "offered", 10_000, 20_000],
  );
  await pool.query(
    "INSERT INTO transactional_outbox (id, event_type, aggregate_id, payload, idempotency_key) VALUES ($1, $2, $3, $4::jsonb, $5)",
    [randomUUID(), "request.created", foreignAddressBookingId, "{}", "proof-foreign-address-request"],
  );

  const pendingOfferCount = await pool.query(
    "SELECT count(*)::int AS count FROM booking_offer WHERE booking_id = $1 AND status = 'pending'",
    [bookingId],
  );
  assert.equal(pendingOfferCount.rows[0]?.count, 2, "Both eligible merchants must have a pending offer for the booking");

  let updater;
  let firstDispatch;
  let lockObserved = false;
  try {
    firstDispatch = dispatcher.dispatchBatch(1);
    await Promise.race([
      sendStarted,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Fake sender did not start")), 5_000)),
    ]);
    updater = await pool.connect();
    await updater.query("SELECT set_config($1, $2, false)", ["application_name", "fixhub-proof-updater"]);
    const pendingUpdate = updater.query(
      "UPDATE service_booking SET customer_note = $1 WHERE id = $2",
      ["concurrent update", bookingId],
    );
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline) {
      const state = await pool.query(
        "SELECT count(*)::int AS count FROM pg_stat_activity WHERE application_name = $1 AND wait_event_type = $2",
        ["fixhub-proof-updater", "Lock"],
      );
      if (state.rows[0].count === 1) {
        lockObserved = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    releaseSend();
    const firstResult = await firstDispatch;
    await pendingUpdate;
    updater.release();
    updater = undefined;
    assert.equal(lockObserved, true, "A concurrent booking update must wait while the message is sent");
    assert.equal(firstResult.sent, 1);
  } finally {
    releaseSend?.();
    if (updater) updater.release();
  }

  const merchantResult = await dispatcher.dispatchBatch(1);
  const secondMerchantResult = await dispatcher.dispatchBatch(1);
  const staleResult = await dispatcher.dispatchBatch(1);
  const foreignAddressResult = await dispatcher.dispatchBatch(1);
  assert.equal(merchantResult.sent, 1);
  assert.equal(secondMerchantResult.sent, 1);
  assert.equal(staleResult.suppressed, 1);
  assert.equal(foreignAddressResult.suppressed, 1);
  assert.equal((await pool.query("SELECT status FROM transactional_outbox WHERE idempotency_key = $1", ["proof-foreign-address-request"])).rows[0]?.status, "suppressed");
  assert.equal(sent.length, 3);
  assert.equal(sent[0].phone, customerPhone);
  assert.deepEqual(sent[0].variables, {
    "1": "Your request is recorded. No provider is assigned yet.", "2": "General plumbing service", "3": "Tanuku",
  });
  assert.equal(sent[1].phone, merchantPhone);
  assert.deepEqual(sent[1].variables, { "1": "New service request", "2": "General plumbing service", "3": "Tanuku" });
  assert.equal(sent[2].phone, secondMerchantPhone);
  assert.deepEqual(sent[2].variables, { "1": "New service request", "2": "General plumbing service", "3": "Tanuku" });

  const outcomes = (await pool.query(
    "SELECT status, count(*)::int AS count FROM transactional_outbox GROUP BY status ORDER BY status",
  )).rows;
  assert.deepEqual(outcomes, [{ status: "sent", count: 3 }, { status: "suppressed", count: 2 }]);
  const supportProof = await verifySupportRequests(pool, bookingId);
  console.log(JSON.stringify({
    server: (await pool.query("SHOW server_version")).rows[0].server_version,
    migrationsApplied: applied.length,
    customerAndMerchantNotifications: sent.length,
    eligibleMerchantsNotified: 2,
    staleNotificationSuppressed: staleResult.suppressed,
    foreignCustomerAddressNotificationSuppressed: foreignAddressResult.suppressed,
    realPostgresBookingLockHeldThroughSend: lockObserved,
    syntheticRecipientLastFour: sent.map(({ phone }) => phone.slice(-4)),
    supportProof,
  }));
} finally {
  await pool?.end();
  if (clusterMayBeRunning) {
    const status = await run(executable("pg_ctl"), ["-D", clusterPath, "status"], { quiet: true });
    if (status.code === 0) {
      const stop = await run(executable("pg_ctl"), ["-D", clusterPath, "-m", "fast", "-w", "-t", "20", "stop"], { quiet: true, timeoutMs: 25_000 });
      if (stop.code !== 0) throw new Error("Temporary PostgreSQL cluster stop failed; preserving its temp directory");
    } else if (status.code !== 3) {
      throw new Error("Could not verify temporary PostgreSQL stopped; preserving its temp directory");
    }
  }
  const resolvedRoot = await realpath(temporaryRoot);
  if (path.dirname(resolvedRoot) !== temporaryParent || !path.basename(resolvedRoot).startsWith("fixhub-whatsapp-outbox-proof-")) {
    throw new Error("Refusing cleanup of an unexpected temporary path");
  }
  await rm(resolvedRoot, { recursive: true, force: true });
}
