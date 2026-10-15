-- DISPOSABLE SYNTHETIC PROOF ONLY. Not a production migration or public API.
CREATE TABLE member(actor integer PRIMARY KEY, merchant integer NOT NULL, active boolean NOT NULL DEFAULT true);
CREATE TABLE resource(id integer PRIMARY KEY, capacity integer NOT NULL CHECK(capacity > 0), reserved integer NOT NULL DEFAULT 0 CHECK(reserved >= 0 AND reserved <= capacity));
CREATE TABLE request(id integer PRIMARY KEY, generation integer NOT NULL DEFAULT 1, state text NOT NULL DEFAULT 'searching' CHECK(state IN ('searching','assigned','cancelled')), version integer NOT NULL DEFAULT 1);
CREATE TABLE offer(request_id integer REFERENCES request, merchant integer NOT NULL, resource_id integer REFERENCES resource, generation integer NOT NULL DEFAULT 1, expires_at timestamptz NOT NULL, eligible boolean NOT NULL DEFAULT true, PRIMARY KEY(request_id, merchant));
CREATE TABLE assignment(request_id integer PRIMARY KEY REFERENCES request, merchant integer NOT NULL, resource_id integer NOT NULL REFERENCES resource);
CREATE TABLE result(actor integer NOT NULL, key text NOT NULL, payload text NOT NULL, receipt text NOT NULL, PRIMARY KEY(actor,key));
CREATE TABLE outbox(request_id integer PRIMARY KEY REFERENCES assignment, event_type text NOT NULL CHECK(event_type='assigned'));

CREATE FUNCTION accept_offer(p_actor integer, p_request integer, p_merchant integer, p_generation integer, p_key text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  m member%ROWTYPE; r request%ROWTYPE; o offer%ROWTYPE;
  prior result%ROWTYPE; c resource%ROWTYPE; receipt text;
  payload text := p_request::text || ':' || p_merchant::text || ':' || p_generation::text;
BEGIN
  -- Caller identity is a synthetic trusted fixture input, NOT authentication.
  SELECT * INTO m FROM member WHERE actor=p_actor FOR SHARE;
  IF NOT FOUND OR NOT m.active OR m.merchant<>p_merchant THEN RETURN 'DENIED'; END IF;
  -- Serializes same actor/key even if two payloads target different requests.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_actor::text || ':' || p_key,0));
  SELECT * INTO prior FROM result WHERE actor=p_actor AND key=p_key;
  IF FOUND THEN
    IF prior.payload<>payload THEN RETURN 'KEY_REUSE'; END IF;
    RETURN prior.receipt;
  END IF;
  SELECT * INTO r FROM request WHERE id=p_request FOR UPDATE;
  IF NOT FOUND THEN receipt := 'NOT_FOUND';
  ELSIF r.generation<>p_generation THEN receipt := 'STALE';
  ELSIF r.state<>'searching' THEN receipt := 'CONFLICT';
  ELSE
    SELECT * INTO o FROM offer WHERE request_id=p_request AND merchant=p_merchant FOR UPDATE;
    IF NOT FOUND OR NOT o.eligible THEN receipt := 'INELIGIBLE';
    ELSIF o.generation<>p_generation THEN receipt := 'STALE';
    ELSIF o.expires_at<=clock_timestamp() THEN receipt := 'EXPIRED';
    ELSE
      SELECT * INTO c FROM resource WHERE id=o.resource_id FOR UPDATE;
      -- Recheck real database clock AFTER any resource lock wait.
      IF o.expires_at<=clock_timestamp() THEN receipt := 'EXPIRED';
      ELSIF c.reserved>=c.capacity THEN receipt := 'CAPACITY';
      ELSE
        UPDATE resource SET reserved=reserved+1 WHERE id=c.id;
        INSERT INTO assignment VALUES(p_request,p_merchant,c.id);
        UPDATE request SET state='assigned',version=version+1 WHERE id=p_request;
        INSERT INTO outbox VALUES(p_request,'assigned');
        receipt := 'WIN:' || p_request::text || ':' || p_merchant::text;
      END IF;
    END IF;
  END IF;
  INSERT INTO result VALUES(p_actor,p_key,payload,receipt);
  RETURN receipt;
END $$;
