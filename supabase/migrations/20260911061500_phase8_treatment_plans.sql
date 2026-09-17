-- Create type for treatment plan status
CREATE TYPE treatment_plan_status AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- Add fields to treatment_plans
ALTER TABLE treatment_plans ADD COLUMN status treatment_plan_status NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE treatment_plans ADD COLUMN notes TEXT;
ALTER TABLE treatment_plans ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Add updated_at trigger
CREATE TRIGGER update_treatment_plans_updated_at
BEFORE UPDATE ON treatment_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add DELETE policy for treatment_items (prevent deleting COMPLETED)
CREATE POLICY "Tenant users can delete uncompleted treatment items" ON treatment_items
    FOR DELETE USING (
        treatment_plan_id IN (SELECT id FROM treatment_plans WHERE tenant_id = public.get_auth_tenant_id())
        AND status != 'COMPLETED'
    );

-- Add DELETE policy for treatment_plans
CREATE POLICY "Tenant users can delete treatment plans" ON treatment_plans
    FOR DELETE USING (tenant_id = public.get_auth_tenant_id());

-- Create a trigger to hard-block deletion of COMPLETED treatment items (defense in depth)
CREATE OR REPLACE FUNCTION prevent_completed_treatment_item_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Cannot delete a completed treatment item.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_completed_item_delete
BEFORE DELETE ON treatment_items
FOR EACH ROW
EXECUTE FUNCTION prevent_completed_treatment_item_deletion();

-- Also prevent updates that attempt to modify a COMPLETED item destructively
CREATE OR REPLACE FUNCTION prevent_completed_treatment_item_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'COMPLETED' THEN
        IF OLD.procedure != NEW.procedure OR OLD.estimated_cost != NEW.estimated_cost OR OLD.tooth_number IS DISTINCT FROM NEW.tooth_number THEN
            RAISE EXCEPTION 'Cannot modify clinical details of a completed treatment item.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_completed_item_update
BEFORE UPDATE ON treatment_items
FOR EACH ROW
EXECUTE FUNCTION prevent_completed_treatment_item_modification();
