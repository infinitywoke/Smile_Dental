-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ENUMS
CREATE TYPE user_role AS ENUM ('DENTIST', 'ASSISTANT', 'ADMIN');
CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE booking_source AS ENUM ('WALK_IN', 'PHONE', 'WHATSAPP', 'WEBSITE', 'GOOGLE', 'REFERRAL', 'INSTAGRAM', 'OTHER');
CREATE TYPE booking_request_status AS ENUM ('NEW', 'CONTACTED', 'CONVERTED', 'DECLINED', 'CANCELLED');
CREATE TYPE treatment_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- TENANTS
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- USERS (Application User Profile linked to auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'ASSISTANT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- BOOKING REQUESTS
CREATE TABLE booking_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    reason TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TIME,
    source booking_source NOT NULL DEFAULT 'WEBSITE',
    status booking_request_status NOT NULL DEFAULT 'NEW',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- PATIENTS
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    date_of_birth DATE,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- LEGACY RECORDS (From Tally/migration)
CREATE TABLE legacy_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    source_system TEXT NOT NULL, -- e.g., 'TALLY'
    source_record_id TEXT NOT NULL, -- The Tally Voucher GUID
    transaction_date DATE NOT NULL,
    raw_patient_identifier TEXT NOT NULL,
    raw_narration TEXT NOT NULL,
    raw_amount DECIMAL(12, 2) NOT NULL,
    raw_payment_mode TEXT NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- APPOINTMENTS
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status appointment_status NOT NULL DEFAULT 'SCHEDULED',
    booking_source booking_source NOT NULL,
    reason TEXT NOT NULL,
    assigned_specialist TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- CLINICAL RECORDS
CREATE TABLE clinical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    chief_complaint TEXT,
    diagnosis TEXT,
    procedure_summary TEXT,
    advice TEXT,
    medications TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
);

-- CLINICAL RECORD TEETH
CREATE TABLE clinical_record_teeth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinical_record_id UUID NOT NULL REFERENCES clinical_records(id) ON DELETE CASCADE,
    tooth_number TEXT NOT NULL,
    notes TEXT
);

-- TREATMENT PLANS
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TREATMENT ITEMS
CREATE TABLE treatment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    procedure TEXT NOT NULL,
    tooth_number TEXT,
    estimated_cost DECIMAL(12, 2),
    status treatment_status NOT NULL DEFAULT 'PLANNED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    treatment_item_id UUID REFERENCES treatment_items(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode TEXT NOT NULL,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_booking_requests_tenant ON booking_requests(tenant_id);
CREATE INDEX idx_patients_tenant ON patients(tenant_id);
CREATE INDEX idx_patients_name_trgm ON patients USING gin(name gin_trgm_ops);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_legacy_records_tenant ON legacy_records(tenant_id);
CREATE INDEX idx_legacy_records_patient ON legacy_records(patient_id);
CREATE INDEX idx_appointments_tenant_patient ON appointments(tenant_id, patient_id);
CREATE INDEX idx_appointments_dates ON appointments(scheduled_start, scheduled_end);
CREATE INDEX idx_clinical_records_tenant_patient ON clinical_records(tenant_id, patient_id);
CREATE INDEX idx_clinical_record_teeth_record ON clinical_record_teeth(clinical_record_id);
CREATE INDEX idx_treatment_plans_tenant_patient ON treatment_plans(tenant_id, patient_id);
CREATE INDEX idx_treatment_items_plan ON treatment_items(treatment_plan_id);
CREATE INDEX idx_payments_tenant_patient ON payments(tenant_id, patient_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- DOUBLE BOOKING CONSTRAINT
ALTER TABLE appointments ADD CONSTRAINT prevent_double_booking 
    EXCLUDE USING gist (
        tenant_id WITH =,
        COALESCE(assigned_specialist, 'MAIN_DENTIST') WITH =,
        tstzrange(scheduled_start, scheduled_end) WITH &&
    )
    WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'));

-- UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_requests_modtime BEFORE UPDATE ON booking_requests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_patients_modtime BEFORE UPDATE ON patients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_appointments_modtime BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
