CREATE TABLE whatsapp_contact (
  subject_id uuid PRIMARY KEY REFERENCES identity_subject(id) ON DELETE CASCADE,
  phone_ciphertext bytea NOT NULL CHECK (octet_length(phone_ciphertext) BETWEEN 8 AND 16),
  phone_iv bytea NOT NULL CHECK (octet_length(phone_iv) = 12),
  phone_auth_tag bytea NOT NULL CHECK (octet_length(phone_auth_tag) = 16),
  phone_hmac bytea NOT NULL CHECK (octet_length(phone_hmac) = 32),
  phone_last_four char(4) NOT NULL CHECK (phone_last_four ~ '^[0-9]{4}$'),
  phone_verified_at timestamptz,
  consent_granted_at timestamptz NOT NULL,
  consent_policy_version text NOT NULL CHECK (length(consent_policy_version) BETWEEN 1 AND 64),
  consent_revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE whatsapp_consent_event (
  id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('consent_granted', 'phone_verified', 'consent_revoked', 'phone_changed')),
  phone_hmac bytea NOT NULL CHECK (octet_length(phone_hmac) = 32),
  consent_policy_version text NOT NULL CHECK (length(consent_policy_version) BETWEEN 1 AND 64),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX whatsapp_consent_event_subject_idx ON whatsapp_consent_event (subject_id, created_at DESC);

CREATE TABLE whatsapp_verification_challenge (
  subject_id uuid PRIMARY KEY REFERENCES whatsapp_contact(subject_id) ON DELETE CASCADE,
  phone_hmac bytea NOT NULL CHECK (octet_length(phone_hmac) = 32),
  code_hmac bytea NOT NULL CHECK (octet_length(code_hmac) = 32),
  attempt_count smallint NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  last_sent_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > last_sent_at)
);
