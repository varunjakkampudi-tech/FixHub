ALTER TABLE service_booking
  ALTER COLUMN parts_estimate_paise DROP NOT NULL,
  ALTER COLUMN parts_estimate_paise DROP DEFAULT;
