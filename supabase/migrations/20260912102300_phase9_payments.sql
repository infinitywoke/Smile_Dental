-- Phase 9: Payments & Financial Transaction Tracking

-- Add treatment_plan_id to payments
ALTER TABLE payments ADD COLUMN treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE SET NULL;

-- Enforce positive payment amount
ALTER TABLE payments Add CONSTRAINT payments_amount_check CHECK (amount > 0);

-- Enforce valid payment methods (if previously arbitrary text, limit to these)
ALTER TABLE payments ADD CONSTRAINT payments_mode_check CHECK (
    payment_mode IN ('CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'OTHER')
);

-- Drop UPDATE policy if it exists (Immutability requirement)
DROP POLICY IF EXISTS "Tenant users can update payments" ON payments;
DROP POLICY IF EXISTS "Tenant users can delete payments" ON payments;

-- Database-level immutability triggers (defense in depth)
CREATE OR REPLACE FUNCTION prevent_payment_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Payments are immutable and cannot be updated or deleted.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_payment_update
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION prevent_payment_modification();

CREATE TRIGGER prevent_payment_delete
BEFORE DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION prevent_payment_modification();

-- Create index for faster querying by treatment plan
CREATE INDEX idx_payments_treatment_plan ON payments(treatment_plan_id);

-- Enforce valid relationships (Patient -> Plan -> Item)
CREATE OR REPLACE FUNCTION check_payment_relationships()
RETURNS TRIGGER AS $$
DECLARE
    plan_patient_id UUID;
    item_plan_id UUID;
BEGIN
    -- If treatment plan is provided, ensure it belongs to the payment's patient
    IF NEW.treatment_plan_id IS NOT NULL THEN
        SELECT patient_id INTO plan_patient_id FROM treatment_plans WHERE id = NEW.treatment_plan_id;
        IF plan_patient_id != NEW.patient_id THEN
            RAISE EXCEPTION 'Treatment plan does not belong to the payment patient.';
        END IF;
    END IF;

    -- If treatment item is provided, ensure it belongs to the payment's treatment plan
    IF NEW.treatment_item_id IS NOT NULL THEN
        SELECT treatment_plan_id INTO item_plan_id FROM treatment_items WHERE id = NEW.treatment_item_id;
        
        -- If payment didn't specify a plan, infer it (though server action does this, DB validates it)
        IF NEW.treatment_plan_id IS NULL THEN
            NEW.treatment_plan_id := item_plan_id;
        ELSIF item_plan_id != NEW.treatment_plan_id THEN
            RAISE EXCEPTION 'Treatment item does not belong to the specified treatment plan.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_payment_rels
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION check_payment_relationships();

