CREATE TABLE public.import_batch_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_batch_id UUID NOT NULL REFERENCES public.import_batches(id) ON DELETE CASCADE,
    legacy_record_id UUID NOT NULL REFERENCES public.legacy_records(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'INSERT' or 'UPDATE'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.import_batch_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant's import batch records"
    ON public.import_batch_records
    FOR ALL
    USING (
        import_batch_id IN (
            SELECT id FROM public.import_batches 
            WHERE tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
        )
    );

-- We need to migrate existing legacy_records into this table to maintain history.
INSERT INTO public.import_batch_records (import_batch_id, legacy_record_id, action)
SELECT import_batch_id, id, 'INSERT'
FROM public.legacy_records
WHERE import_batch_id IS NOT NULL;
