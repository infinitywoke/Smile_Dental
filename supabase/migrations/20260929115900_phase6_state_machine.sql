-- Enforce exact Phase 6 state machine
CREATE OR REPLACE FUNCTION enforce_appointment_state_invariants() RETURNS trigger AS $$
BEGIN
    -- Terminal state protections
    IF OLD.status = 'COMPLETED' AND NEW.status != 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot transition from COMPLETED to active state';
    END IF;
    IF OLD.status = 'CANCELLED' AND NEW.status != 'CANCELLED' THEN
        RAISE EXCEPTION 'Cannot transition from CANCELLED to active state';
    END IF;

    -- State Machine specific transitions
    IF OLD.status != NEW.status THEN
        IF OLD.status = 'SCHEDULED' AND NEW.status NOT IN ('CONFIRMED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW') THEN
            RAISE EXCEPTION 'Invalid transition from SCHEDULED to %', NEW.status;
        END IF;
        IF OLD.status = 'CONFIRMED' AND NEW.status NOT IN ('CHECKED_IN', 'CANCELLED', 'NO_SHOW') THEN
            RAISE EXCEPTION 'Invalid transition from CONFIRMED to %', NEW.status;
        END IF;
        IF OLD.status = 'CHECKED_IN' AND NEW.status NOT IN ('IN_PROGRESS', 'CANCELLED', 'NO_SHOW') THEN
            RAISE EXCEPTION 'Invalid transition from CHECKED_IN to %', NEW.status;
        END IF;
        IF OLD.status = 'IN_PROGRESS' AND NEW.status NOT IN ('COMPLETED', 'CANCELLED') THEN
            RAISE EXCEPTION 'Invalid transition from IN_PROGRESS to %', NEW.status;
        END IF;
        IF OLD.status = 'NO_SHOW' AND NEW.status NOT IN ('CHECKED_IN', 'CANCELLED') THEN
            RAISE EXCEPTION 'NO_SHOW can only transition to CHECKED_IN or CANCELLED';
        END IF;
    END IF;

    -- Clinical integrity for COMPLETED
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        IF NOT EXISTS (SELECT 1 FROM clinical_records WHERE appointment_id = NEW.id) THEN
            RAISE EXCEPTION 'A COMPLETED appointment must have a corresponding clinical record.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
