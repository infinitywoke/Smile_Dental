DO $$
DECLARE
  v_patient_id UUID;
BEGIN
  ALTER TABLE payments DISABLE TRIGGER USER;
  ALTER TABLE treatment_items DISABLE TRIGGER USER;
  ALTER TABLE appointments DISABLE TRIGGER USER;
  ALTER TABLE treatment_plans DISABLE TRIGGER USER;
  ALTER TABLE clinical_records DISABLE TRIGGER USER;

  FOR v_patient_id IN 
    SELECT id FROM patients WHERE name NOT IN ('Arjun Kumar', 'Sneha Patel', 'Ravi Sharma', 'Kavita Singh', 'Vikram Reddy', 'Pooja Desai', 'Rahul Gupta', 'Meera Joshi', 'Amit Verma', 'Neha Agarwal', 'Patient A', 'Patient B', 'Specialist Patient A', 'Specialist Patient B', 'Parent Patient', 'Child Patient', 'Tenant One Patient', 'Edit Test Patient', 'Edited Test Patient')
  LOOP
    DELETE FROM payments WHERE patient_id = v_patient_id;
    DELETE FROM clinical_records WHERE patient_id = v_patient_id;
    DELETE FROM appointments WHERE patient_id = v_patient_id;
    DELETE FROM treatment_items WHERE treatment_plan_id IN (SELECT id FROM treatment_plans WHERE patient_id = v_patient_id);
    DELETE FROM treatment_plans WHERE patient_id = v_patient_id;
    DELETE FROM specialist_referrals WHERE patient_id = v_patient_id;
    DELETE FROM patients WHERE id = v_patient_id;
  END LOOP;

  ALTER TABLE clinical_records ENABLE TRIGGER USER;
  ALTER TABLE treatment_plans ENABLE TRIGGER USER;
  ALTER TABLE appointments ENABLE TRIGGER USER;
  ALTER TABLE treatment_items ENABLE TRIGGER USER;
  ALTER TABLE payments ENABLE TRIGGER USER;
END;
$$;
