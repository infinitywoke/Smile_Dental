-- Phase 15.2 Schema Additions

-- 1. Date of Birth
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE booking_requests ADD COLUMN IF NOT EXISTS dob DATE;

-- 2. Patient Relationships
CREATE TABLE IF NOT EXISTS patient_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    related_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('PARENT', 'CHILD', 'SPOUSE', 'SIBLING', 'GUARDIAN', 'OTHER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT prevent_self_relationship CHECK (patient_id != related_patient_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_patient_relationships_unique 
ON patient_relationships(tenant_id, patient_id, related_patient_id);

ALTER TABLE patient_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_patient_relationships"
ON patient_relationships
FOR ALL
TO authenticated
USING (tenant_id = public.get_auth_tenant_id());

-- 3. Specialist Referrals
CREATE TYPE specialist_referral_status AS ENUM (
    'PENDING_ADVANCE', 'ADVANCE_PAID', 'SCHEDULED', 'COMPLETED', 'CANCELLED'
);

CREATE TABLE IF NOT EXISTS specialist_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE SET NULL,
    specialist_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    estimated_cost NUMERIC(10,2) NOT NULL,
    advance_percentage NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    advance_required NUMERIC(10,2) NOT NULL,
    status specialist_referral_status NOT NULL DEFAULT 'PENDING_ADVANCE',
    scheduled_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE specialist_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_specialist_referrals"
ON specialist_referrals
FOR ALL
TO authenticated
USING (tenant_id = public.get_auth_tenant_id());

-- Link payments to specialist referrals
ALTER TABLE payments ADD COLUMN IF NOT EXISTS specialist_referral_id UUID REFERENCES specialist_referrals(id) ON DELETE SET NULL;
