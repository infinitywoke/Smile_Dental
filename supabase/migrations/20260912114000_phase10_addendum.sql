-- 1. Add patient_id to booking_requests
ALTER TABLE booking_requests 
ADD COLUMN patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

CREATE INDEX idx_booking_requests_patient ON booking_requests(patient_id);

-- 2. Create atomic conversion RPC
CREATE OR REPLACE FUNCTION convert_booking_request_to_patient(
    p_request_id UUID,
    p_existing_patient_id UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER -- runs with permissions of caller, enforcing RLS
AS $$
DECLARE
    v_request RECORD;
    v_patient_id UUID;
BEGIN
    -- 1. Lock the request row
    SELECT * INTO v_request 
    FROM booking_requests 
    WHERE id = p_request_id 
    FOR UPDATE;

    IF v_request IS NULL THEN
        RAISE EXCEPTION 'Booking request not found';
    END IF;

    -- 2. Idempotency Check
    IF v_request.status = 'CONVERTED' THEN
        IF v_request.patient_id IS NULL THEN
            RAISE EXCEPTION 'Booking request marked converted but missing patient_id';
        END IF;
        RETURN v_request.patient_id;
    END IF;

    -- 3. Determine patient
    IF p_existing_patient_id IS NOT NULL THEN
        -- Verify patient belongs to same tenant
        SELECT id INTO v_patient_id 
        FROM patients 
        WHERE id = p_existing_patient_id AND tenant_id = v_request.tenant_id;
        
        IF v_patient_id IS NULL THEN
            RAISE EXCEPTION 'Provided patient ID not found or cross-tenant violation';
        END IF;
    ELSE
        -- Create new patient
        INSERT INTO patients (tenant_id, name, phone)
        VALUES (v_request.tenant_id, v_request.name, v_request.phone)
        RETURNING id INTO v_patient_id;
    END IF;

    -- 4. Update request
    UPDATE booking_requests
    SET status = 'CONVERTED',
        patient_id = v_patient_id
    WHERE id = p_request_id;

    RETURN v_patient_id;
END;
$$;
