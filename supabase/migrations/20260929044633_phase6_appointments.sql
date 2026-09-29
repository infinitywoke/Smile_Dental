-- Phase 6 Appointments Migration
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS prevent_double_booking;

ALTER TABLE appointments ADD CONSTRAINT valid_appointment_duration 
    CHECK (scheduled_start < scheduled_end);

ALTER TABLE appointments ADD CONSTRAINT prevent_double_booking 
    EXCLUDE USING gist (
        tenant_id WITH =,
        COALESCE(assigned_specialist, 'MAIN_DENTIST') WITH =,
        tstzrange(scheduled_start, scheduled_end, '[)') WITH &&
    )
    WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'));

CREATE OR REPLACE FUNCTION enforce_appointment_state_invariants() RETURNS trigger AS $$
BEGIN
    IF OLD.status = 'COMPLETED' AND NEW.status != 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot transition from COMPLETED to active state';
    END IF;
    IF OLD.status = 'CANCELLED' AND NEW.status != 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot transition from CANCELLED to active state';
    END IF;
    IF OLD.status = 'NO_SHOW' AND NEW.status NOT IN ('NO_SHOW', 'CHECKED_IN', 'CANCELLED') THEN
        RAISE EXCEPTION 'NO_SHOW can only transition to CHECKED_IN or CANCELLED';
    END IF;
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        IF NOT EXISTS (SELECT 1 FROM clinical_records WHERE appointment_id = NEW.id) THEN
            RAISE EXCEPTION 'A COMPLETED appointment must have a corresponding clinical record.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_appointment_state_invariants
BEFORE UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION enforce_appointment_state_invariants();

CREATE INDEX idx_appointments_agenda ON appointments(tenant_id, scheduled_start);
