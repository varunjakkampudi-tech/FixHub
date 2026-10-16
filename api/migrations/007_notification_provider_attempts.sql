ALTER TABLE transactional_outbox
  DROP CONSTRAINT transactional_outbox_status_check,
  ADD CONSTRAINT transactional_outbox_status_check
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'suppressed', 'uncertain')),
  ADD COLUMN provider_attempt_started_at timestamptz;

CREATE INDEX transactional_outbox_provider_attempt_idx
  ON transactional_outbox (claimed_at)
  WHERE status = 'processing' AND provider_attempt_started_at IS NOT NULL;
