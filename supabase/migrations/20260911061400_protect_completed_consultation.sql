CREATE OR REPLACE FUNCTION save_consultation(
    p_appointment_id UUID,
    p_chief_complaint TEXT,
    p_diagnosis TEXT,
    p_procedure_summary TEXT,
    p_advice TEXT,
    p_medications TEXT,
    p_teeth JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_tenant_id UUID;
    v_patient_id UUID;
    v_status TEXT;
    v_clinical_record_id UUID;
    v_user_id UUID;
    v_tooth JSONB;
BEGIN
    -- 1. Get tenant_id, patient_id, and status
    SELECT tenant_id, patient_id, status INTO v_tenant_id, v_patient_id, v_status
    FROM appointments
    WHERE id = p_appointment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment not found or access denied';
    END IF;

    -- 2. Guard against completed/cancelled appointments
    IF v_status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot modify consultation for a completed appointment';
    END IF;

    IF v_status IN ('CANCELLED', 'NO_SHOW') THEN
        RAISE EXCEPTION 'Cannot save consultation for cancelled or no-show appointment';
    END IF;

    -- 3. Get current user ID
    v_user_id := auth.uid();

    -- 4. Update appointment status to IN_PROGRESS if CHECKED_IN (or SCHEDULED/CONFIRMED safely)
    UPDATE appointments
    SET status = 'IN_PROGRESS', updated_at = NOW()
    WHERE id = p_appointment_id AND status IN ('CHECKED_IN', 'SCHEDULED', 'CONFIRMED');

    -- 5. Upsert clinical_record
    INSERT INTO clinical_records (
        tenant_id, patient_id, appointment_id, created_by,
        chief_complaint, diagnosis, procedure_summary, advice, medications
    ) VALUES (
        v_tenant_id, v_patient_id, p_appointment_id, v_user_id,
        p_chief_complaint, p_diagnosis, p_procedure_summary, p_advice, p_medications
    )
    ON CONFLICT (appointment_id) DO UPDATE SET
        chief_complaint = EXCLUDED.chief_complaint,
        diagnosis = EXCLUDED.diagnosis,
        procedure_summary = EXCLUDED.procedure_summary,
        advice = EXCLUDED.advice,
        medications = EXCLUDED.medications
    RETURNING id INTO v_clinical_record_id;

    -- 6. Delete existing teeth to replace them
    DELETE FROM clinical_record_teeth WHERE clinical_record_id = v_clinical_record_id;

    -- 7. Insert new teeth
    IF p_teeth IS NOT NULL AND jsonb_array_length(p_teeth) > 0 THEN
        FOR v_tooth IN SELECT * FROM jsonb_array_elements(p_teeth)
        LOOP
            INSERT INTO clinical_record_teeth (clinical_record_id, tooth_number, notes)
            VALUES (
                v_clinical_record_id,
                v_tooth->>'tooth_number',
                v_tooth->>'notes'
            );
        END LOOP;
    END IF;

    RETURN v_clinical_record_id;
END;
$$;
