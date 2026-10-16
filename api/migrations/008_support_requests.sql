CREATE TABLE support_ticket (
  id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE RESTRICT,
  booking_id uuid REFERENCES service_booking(id) ON DELETE RESTRICT,
  subject text NOT NULL CHECK (length(btrim(subject)) BETWEEN 3 AND 120),
  description text NOT NULL CHECK (length(btrim(description)) BETWEEN 10 AND 2000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved')),
  response_text text CHECK (length(btrim(response_text)) BETWEEN 5 AND 2000),
  responded_by uuid REFERENCES identity_subject(id) ON DELETE RESTRICT,
  version integer NOT NULL DEFAULT 0 CHECK (version >= 0),
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32),
  created_at timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (subject_id, idempotency_key),
  CHECK ((response_text IS NULL AND responded_by IS NULL) OR (response_text IS NOT NULL AND responded_by IS NOT NULL)),
  CHECK (status <> 'resolved' OR response_text IS NOT NULL)
);

CREATE INDEX support_ticket_owner_idx ON support_ticket (subject_id, created_at DESC, id DESC);
CREATE INDEX support_ticket_queue_idx ON support_ticket (created_at DESC, id DESC) WHERE status <> 'resolved';

CREATE TABLE support_ticket_response (
  id uuid PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES support_ticket(id) ON DELETE RESTRICT,
  author_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE RESTRICT,
  response_text text NOT NULL CHECK (length(btrim(response_text)) BETWEEN 5 AND 2000),
  status text NOT NULL CHECK (status IN ('open', 'in_review', 'resolved')),
  version integer NOT NULL CHECK (version > 0),
  created_at timestamptz(3) NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (ticket_id, version)
);
