CREATE OR REPLACE FUNCTION cleanup_test_data(patient_ids UUID[])
RETURNS void AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  ALTER TABLE payments DISABLE TRIGGER USER;
  ALTER TABLE treatment_items DISABLE TRIGGER USER;
  
  FOREACH v_patient_id IN ARRAY patient_ids
  LOOP
    DELETE FROM payments WHERE patient_id = v_patient_id;
    DELETE FROM clinical_records WHERE patient_id = v_patient_id;
    DELETE FROM appointments WHERE patient_id = v_patient_id;
    DELETE FROM treatment_items WHERE treatment_plan_id IN (SELECT id FROM treatment_plans WHERE patient_id = v_patient_id);
    DELETE FROM treatment_plans WHERE patient_id = v_patient_id;
    DELETE FROM specialist_referrals WHERE patient_id = v_patient_id;
    DELETE FROM patients WHERE id = v_patient_id;
  END LOOP;

  ALTER TABLE treatment_items ENABLE TRIGGER USER;
  ALTER TABLE payments ENABLE TRIGGER USER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
