CREATE TYPE import_batch_status AS ENUM ('CREATED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE match_status AS ENUM ('UNMATCHED', 'CANDIDATE', 'AUTO_MATCHED', 'MANUAL_REVIEW', 'CONFIRMED', 'REJECTED');

-- Create Import Batches Table
CREATE TABLE public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    source_system TEXT NOT NULL,
    filename TEXT,
    status import_batch_status NOT NULL DEFAULT 'CREATED',
    record_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their tenant's import batches"
    ON public.import_batches
    FOR ALL
    USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

-- Extend legacy_records
ALTER TABLE public.legacy_records 
    ADD COLUMN import_batch_id UUID REFERENCES public.import_batches(id) ON DELETE SET NULL,
    ADD COLUMN match_status match_status NOT NULL DEFAULT 'UNMATCHED',
    ADD COLUMN match_confidence INTEGER,
    ADD COLUMN candidate_patients JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN parsed_name TEXT,
    ADD COLUMN parsed_phone TEXT,
    ADD COLUMN parsed_address TEXT,
    ADD COLUMN historical_age TEXT;

-- Create unique constraint for idempotency
-- A given source record from a given source system within a tenant must be unique.
ALTER TABLE public.legacy_records
    ADD CONSTRAINT uq_legacy_records_source UNIQUE (tenant_id, source_system, source_record_id);
