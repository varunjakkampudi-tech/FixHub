CREATE TABLE identity_subject (
  id uuid PRIMARY KEY,
  email_normalized text NOT NULL UNIQUE,
  display_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deletion_pending', 'deleted')),
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (email_normalized = lower(btrim(email_normalized))),
  CHECK (length(email_normalized) BETWEEN 3 AND 254),
  CHECK (display_name IS NULL OR length(display_name) <= 80)
);

CREATE TABLE email_login_challenge (
  id uuid PRIMARY KEY,
  email_normalized text NOT NULL,
  code_hmac bytea NOT NULL,
  attempt_count smallint NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  issued_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > issued_at),
  CHECK (octet_length(code_hmac) = 32)
);

CREATE INDEX email_login_challenge_email_issued_idx
  ON email_login_challenge (email_normalized, issued_at DESC);

CREATE INDEX email_login_challenge_expiry_idx
  ON email_login_challenge (expires_at)
  WHERE consumed_at IS NULL;

CREATE TABLE identity_session (
  id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE CASCADE,
  token_hmac bytea NOT NULL UNIQUE,
  csrf_hmac bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_seen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (octet_length(token_hmac) = 32),
  CHECK (octet_length(csrf_hmac) = 32),
  CHECK (expires_at > created_at)
);

CREATE INDEX identity_session_subject_active_idx
  ON identity_session (subject_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE INDEX identity_session_expiry_idx
  ON identity_session (expires_at)
  WHERE revoked_at IS NULL;
