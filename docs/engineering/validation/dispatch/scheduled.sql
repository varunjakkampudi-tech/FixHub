-- Synthetic interval mechanism proof only. No production migration/auth API.
CREATE EXTENSION btree_gist;
CREATE TABLE capacity_unit(id integer PRIMARY KEY CHECK(id>0));
CREATE TABLE reservation(
  request_id integer PRIMARY KEY CHECK(request_id>0), merchant integer NOT NULL CHECK(merchant>0), key text NOT NULL CHECK(btrim(key)<>''),
  unit_id integer NOT NULL REFERENCES capacity_unit, span tstzrange NOT NULL,
  active boolean NOT NULL DEFAULT true, UNIQUE(merchant,key),
  CHECK(NOT isempty(span) AND NOT lower_inf(span) AND NOT upper_inf(span)),
  CHECK(isfinite(lower(span)) AND isfinite(upper(span)) AND lower_inc(span) AND NOT upper_inc(span)),
  EXCLUDE USING gist(unit_id WITH =, span WITH &&) WHERE(active)
);
CREATE TABLE schedule_outbox(request_id integer REFERENCES reservation, event text CHECK(event IN ('reserved','released')), PRIMARY KEY(request_id,event));

CREATE FUNCTION reserve_interval(p_merchant integer,p_request integer,p_unit integer,p_key text,p_start timestamptz,p_end timestamptz) RETURNS text LANGUAGE plpgsql AS $$
DECLARE prior reservation%ROWTYPE; requested tstzrange;
BEGIN
  IF p_merchant IS NULL OR p_request IS NULL OR p_unit IS NULL OR p_merchant<=0 OR p_request<=0 OR p_unit<=0 OR p_start IS NULL OR p_end IS NULL OR NOT isfinite(p_start) OR NOT isfinite(p_end) OR p_end<=p_start OR p_key IS NULL OR btrim(p_key)='' THEN RETURN 'INVALID'; END IF;
  requested := tstzrange(p_start,p_end,'[)');
  PERFORM pg_advisory_xact_lock(hashtextextended(p_merchant::text||':'||p_key,0));
  SELECT * INTO prior FROM reservation WHERE merchant=p_merchant AND key=p_key;
  IF FOUND THEN
    IF prior.request_id<>p_request OR prior.unit_id<>p_unit OR prior.span<>requested THEN RETURN 'KEY_REUSE'; END IF;
    -- Historical committed receipt, NOT a fresh claim that reservation is still active.
    RETURN 'RESERVED:'||p_request::text;
  END IF;
  PERFORM id FROM capacity_unit WHERE id=p_unit FOR UPDATE;
  IF NOT FOUND THEN RETURN 'INVALID'; END IF;
  IF EXISTS(SELECT 1 FROM reservation WHERE unit_id=p_unit AND active AND span && requested) THEN RETURN 'CAPACITY'; END IF;
  INSERT INTO reservation VALUES(p_request,p_merchant,p_key,p_unit,requested,true);
  INSERT INTO schedule_outbox VALUES(p_request,'reserved');
  RETURN 'RESERVED:'||p_request::text;
EXCEPTION WHEN exclusion_violation THEN RETURN 'CAPACITY';
          WHEN unique_violation THEN RETURN 'REQUEST_EXISTS';
END $$;

CREATE FUNCTION release_interval(p_merchant integer,p_request integer) RETURNS text LANGUAGE plpgsql AS $$
DECLARE target reservation%ROWTYPE;
BEGIN
  IF p_merchant IS NULL OR p_request IS NULL OR p_merchant<=0 OR p_request<=0 THEN RETURN 'INVALID'; END IF;
  SELECT * INTO target FROM reservation WHERE request_id=p_request;
  IF NOT FOUND THEN RETURN 'NOT_FOUND'; END IF;
  PERFORM id FROM capacity_unit WHERE id=target.unit_id FOR UPDATE;
  SELECT * INTO target FROM reservation WHERE request_id=p_request FOR UPDATE;
  IF target.merchant<>p_merchant THEN RETURN 'DENIED'; END IF;
  IF NOT target.active THEN RETURN 'RELEASED:'||p_request::text; END IF;
  UPDATE reservation SET active=false WHERE request_id=p_request;
  INSERT INTO schedule_outbox VALUES(p_request,'released');
  RETURN 'RELEASED:'||p_request::text;
END $$;
