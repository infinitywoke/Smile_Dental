CREATE OR REPLACE FUNCTION prevent_invalid_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
        IF NOT EXISTS (SELECT 1 FROM clinical_records WHERE appointment_id = NEW.id) THEN
            RAISE EXCEPTION 'Cannot complete an appointment without a clinical record';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_invalid_appointment_completion ON appointments;
CREATE TRIGGER prevent_invalid_appointment_completion
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION prevent_invalid_completion();
