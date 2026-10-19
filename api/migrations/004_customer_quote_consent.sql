ALTER TABLE service_booking
  ADD COLUMN customer_quote_accepted_at timestamptz,
  ADD COLUMN customer_accepted_quote_hash bytea,
  ADD CONSTRAINT service_booking_quote_acceptance_pair CHECK (
    (customer_quote_accepted_at IS NULL AND customer_accepted_quote_hash IS NULL)
    OR (customer_quote_accepted_at IS NOT NULL AND customer_accepted_quote_hash IS NOT NULL
        AND octet_length(customer_accepted_quote_hash) = 32)
  );
