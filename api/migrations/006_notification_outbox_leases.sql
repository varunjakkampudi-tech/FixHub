ALTER TABLE transactional_outbox
  DROP CONSTRAINT transactional_outbox_status_check,
  ADD CONSTRAINT transactional_outbox_status_check CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'suppressed'));

ALTER TABLE transactional_outbox
  ADD COLUMN claimed_at timestamptz,
  ADD COLUMN claim_token uuid,
  ADD COLUMN last_attempt_at timestamptz,
  ADD COLUMN provider_message_id text,
  ADD COLUMN provider_status text CHECK (provider_status IS NULL OR length(provider_status) <= 32),
  ADD COLUMN last_error_code text CHECK (last_error_code IS NULL OR length(last_error_code) <= 64);

CREATE INDEX transactional_outbox_claimable_idx
  ON transactional_outbox (available_at, created_at)
  WHERE status = 'pending';
