CREATE TABLE identity_role (
  subject_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('customer', 'merchant', 'technician', 'support', 'admin')),
  granted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (subject_id, role)
);

CREATE TABLE merchant_profile (
  subject_id uuid PRIMARY KEY REFERENCES identity_subject(id) ON DELETE RESTRICT,
  business_name text NOT NULL CHECK (length(btrim(business_name)) BETWEEN 2 AND 120),
  public_phone text,
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')),
  accepting_jobs boolean NOT NULL DEFAULT false,
  service_radius_km numeric(5,2) NOT NULL DEFAULT 5 CHECK (service_radius_km BETWEEN 0.5 AND 100),
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);

CREATE TABLE service_catalog (
  id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 2 AND 100),
  category text NOT NULL CHECK (category IN ('electrician', 'plumbing', 'ac', 'appliance')),
  description text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE merchant_service (
  merchant_id uuid NOT NULL REFERENCES merchant_profile(subject_id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES service_catalog(id) ON DELETE RESTRICT,
  visit_price_paise integer NOT NULL CHECK (visit_price_paise BETWEEN 0 AND 100000000),
  labor_from_paise integer NOT NULL CHECK (labor_from_paise BETWEEN 0 AND 100000000),
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (merchant_id, service_id),
  CHECK (labor_from_paise >= visit_price_paise)
);

CREATE TABLE customer_address (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE CASCADE,
  label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 40),
  address_text text NOT NULL CHECK (length(btrim(address_text)) BETWEEN 5 AND 500),
  locality text NOT NULL CHECK (length(btrim(locality)) BETWEEN 2 AND 120),
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))
);

CREATE INDEX customer_address_owner_idx ON customer_address (customer_id, created_at DESC);

CREATE TABLE service_booking (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE RESTRICT,
  merchant_id uuid REFERENCES merchant_profile(subject_id) ON DELETE RESTRICT,
  service_id uuid NOT NULL REFERENCES service_catalog(id) ON DELETE RESTRICT,
  address_id uuid NOT NULL REFERENCES customer_address(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'offered', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled', 'disputed')),
  scheduled_at timestamptz,
  customer_note text NOT NULL DEFAULT '' CHECK (length(customer_note) <= 2000),
  visit_price_paise integer NOT NULL CHECK (visit_price_paise BETWEEN 0 AND 100000000),
  labor_estimate_paise integer NOT NULL CHECK (labor_estimate_paise BETWEEN 0 AND 100000000),
  parts_estimate_paise integer CHECK (parts_estimate_paise BETWEEN 0 AND 100000000),
  currency char(3) NOT NULL DEFAULT 'INR' CHECK (currency = 'INR'),
  payment_method text NOT NULL DEFAULT 'cash_on_completion' CHECK (payment_method = 'cash_on_completion'),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (labor_estimate_paise + visit_price_paise + parts_estimate_paise <= 200000000)
);

CREATE INDEX service_booking_customer_idx ON service_booking (customer_id, created_at DESC);
CREATE INDEX service_booking_merchant_status_idx ON service_booking (merchant_id, status, scheduled_at);

CREATE TABLE booking_offer (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES service_booking(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES merchant_profile(subject_id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  visit_price_paise integer NOT NULL CHECK (visit_price_paise BETWEEN 0 AND 100000000),
  labor_price_paise integer NOT NULL CHECK (labor_price_paise BETWEEN 0 AND 100000000),
  offered_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz,
  responded_at timestamptz,
  UNIQUE (booking_id, merchant_id),
  CHECK (expires_at IS NULL OR expires_at > offered_at)
);

CREATE INDEX booking_offer_merchant_pending_idx ON booking_offer (merchant_id, expires_at) WHERE status = 'pending';

CREATE TABLE booking_review (
  id uuid PRIMARY KEY,
  booking_id uuid NOT NULL UNIQUE REFERENCES service_booking(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE RESTRICT,
  merchant_id uuid NOT NULL REFERENCES merchant_profile(subject_id) ON DELETE RESTRICT,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '' CHECK (length(comment) <= 2000),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE transactional_outbox (
  id uuid PRIMARY KEY,
  event_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL CHECK (pg_column_size(payload) <= 65536),
  idempotency_key text NOT NULL UNIQUE CHECK (length(idempotency_key) BETWEEN 1 AND 256),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempt_count smallint NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 20),
  available_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  processed_at timestamptz
);

CREATE INDEX transactional_outbox_pending_idx ON transactional_outbox (available_at, created_at) WHERE status IN ('pending', 'failed');

CREATE TABLE request_idempotency (
  subject_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE CASCADE,
  route_key text NOT NULL CHECK (length(route_key) BETWEEN 1 AND 100),
  idempotency_key text NOT NULL CHECK (length(idempotency_key) BETWEEN 16 AND 128),
  request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32),
  response_body jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (subject_id, route_key, idempotency_key)
);

CREATE TABLE privacy_request (
  id uuid PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES identity_subject(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('account_deletion')),
  status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'under_review', 'completed', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  resolved_at timestamptz,
  resolution_note text NOT NULL DEFAULT '' CHECK (length(resolution_note) <= 2000),
  CHECK ((status IN ('completed', 'rejected')) = (resolved_at IS NOT NULL))
);

CREATE UNIQUE INDEX privacy_request_one_open_deletion_idx
  ON privacy_request (subject_id)
  WHERE kind = 'account_deletion' AND status IN ('requested', 'under_review');

INSERT INTO service_catalog (id, slug, name, category, description) VALUES
  ('10000000-0000-4000-8000-000000000001', 'electrician-general', 'General electrical service', 'electrician', 'Inspection and common electrical repairs.'),
  ('10000000-0000-4000-8000-000000000002', 'plumbing-general', 'General plumbing service', 'plumbing', 'Inspection and common plumbing repairs.'),
  ('10000000-0000-4000-8000-000000000003', 'ac-repair', 'Air conditioning service', 'ac', 'Air conditioning inspection and repair.'),
  ('10000000-0000-4000-8000-000000000004', 'appliance-repair', 'Appliance repair', 'appliance', 'Common household appliance diagnostics and repairs.');
