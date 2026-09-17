CREATE POLICY "Tenant users can delete clinical record teeth" ON clinical_record_teeth
    FOR DELETE USING (clinical_record_id IN (SELECT id FROM clinical_records WHERE tenant_id = public.get_auth_tenant_id()));
