-- ENABLE RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_record_teeth ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTIONS (Security Definer to bypass RLS and avoid infinite recursion)
-- search_path is set to public to prevent search path injection attacks.
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id() RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_role() RETURNS public.user_role AS $$
  SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- POLICIES: TENANTS
-- No tenant manipulation allowed from client.
CREATE POLICY "Users can view their own tenant" ON tenants
    FOR SELECT USING (id = public.get_auth_tenant_id());

-- POLICIES: USERS
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all users in tenant" ON users
    FOR SELECT USING (public.get_auth_tenant_id() = tenant_id AND public.get_auth_role() = 'ADMIN');
CREATE POLICY "Admins can update users in tenant" ON users
    FOR UPDATE USING (public.get_auth_tenant_id() = tenant_id AND public.get_auth_role() = 'ADMIN');

-- POLICIES: BOOKING REQUESTS
-- Public anonymous INSERT is completely REMOVED. 
-- Booking requests will be inserted securely via Next.js Server Actions using a server-side mechanism.
CREATE POLICY "Tenant users can view booking requests" ON booking_requests
    FOR SELECT USING (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can update booking requests" ON booking_requests
    FOR UPDATE USING (tenant_id = public.get_auth_tenant_id());

-- POLICIES: PATIENTS
CREATE POLICY "Tenant users can view patients" ON patients
    FOR SELECT USING (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can insert patients" ON patients
    FOR INSERT WITH CHECK (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can update patients" ON patients
    FOR UPDATE USING (tenant_id = public.get_auth_tenant_id());

-- POLICIES: LEGACY RECORDS
CREATE POLICY "Tenant users can view legacy records" ON legacy_records
    FOR SELECT USING (tenant_id = public.get_auth_tenant_id());

-- POLICIES: APPOINTMENTS
CREATE POLICY "Tenant users can view appointments" ON appointments
    FOR SELECT USING (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can insert appointments" ON appointments
    FOR INSERT WITH CHECK (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can update appointments" ON appointments
    FOR UPDATE USING (tenant_id = public.get_auth_tenant_id());

-- POLICIES: CLINICAL RECORDS
CREATE POLICY "Tenant users can view clinical records" ON clinical_records
    FOR SELECT USING (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can insert clinical records" ON clinical_records
    FOR INSERT WITH CHECK (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can update clinical records" ON clinical_records
    FOR UPDATE USING (tenant_id = public.get_auth_tenant_id());

-- POLICIES: CLINICAL RECORD TEETH
CREATE POLICY "Tenant users can view clinical record teeth" ON clinical_record_teeth
    FOR SELECT USING (clinical_record_id IN (SELECT id FROM clinical_records WHERE tenant_id = public.get_auth_tenant_id()));
CREATE POLICY "Tenant users can insert clinical record teeth" ON clinical_record_teeth
    FOR INSERT WITH CHECK (clinical_record_id IN (SELECT id FROM clinical_records WHERE tenant_id = public.get_auth_tenant_id()));
CREATE POLICY "Tenant users can update clinical record teeth" ON clinical_record_teeth
    FOR UPDATE USING (clinical_record_id IN (SELECT id FROM clinical_records WHERE tenant_id = public.get_auth_tenant_id()));

-- POLICIES: TREATMENT PLANS
CREATE POLICY "Tenant users can view treatment plans" ON treatment_plans
    FOR SELECT USING (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can insert treatment plans" ON treatment_plans
    FOR INSERT WITH CHECK (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can update treatment plans" ON treatment_plans
    FOR UPDATE USING (tenant_id = public.get_auth_tenant_id());

-- POLICIES: TREATMENT ITEMS
CREATE POLICY "Tenant users can view treatment items" ON treatment_items
    FOR SELECT USING (treatment_plan_id IN (SELECT id FROM treatment_plans WHERE tenant_id = public.get_auth_tenant_id()));
CREATE POLICY "Tenant users can insert treatment items" ON treatment_items
    FOR INSERT WITH CHECK (treatment_plan_id IN (SELECT id FROM treatment_plans WHERE tenant_id = public.get_auth_tenant_id()));
CREATE POLICY "Tenant users can update treatment items" ON treatment_items
    FOR UPDATE USING (treatment_plan_id IN (SELECT id FROM treatment_plans WHERE tenant_id = public.get_auth_tenant_id()));

-- POLICIES: PAYMENTS
CREATE POLICY "Tenant users can view payments" ON payments
    FOR SELECT USING (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can insert payments" ON payments
    FOR INSERT WITH CHECK (tenant_id = public.get_auth_tenant_id());
CREATE POLICY "Tenant users can update payments" ON payments
    FOR UPDATE USING (tenant_id = public.get_auth_tenant_id());
