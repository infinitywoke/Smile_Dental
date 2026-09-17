const { execSync } = require('child_process');
const fs = require('fs');

console.log('Generating types...');
const types = execSync('npx supabase gen types typescript --local', { encoding: 'utf-8' });

const append = `
  export type BookingRequestStatus = Enums<'booking_request_status'>
  export type PatientProfile = Tables<'patients'> & {
    appointments?: any[];
    clinical_records?: any[];
    treatment_plans?: any[];
    legacy_records?: any[];
    patient_relationships?: any[];
    patient_relationships_related?: any[];
  }
  export type Payment = Tables<'payments'> & { treatment_plan_id?: string | null }
  export type TreatmentPlan = Tables<'treatment_plans'>
  export type TreatmentItem = Tables<'treatment_items'>
  export type ClinicalRecord = Tables<'clinical_records'>
  export type ToothRecord = Tables<'clinical_record_teeth'>
  export type Patient = PatientProfile
  export type Appointment = Tables<'appointments'> & { patients?: any }
  export type AppointmentStatus = Enums<'appointment_status'>
  export type BookingRequest = Tables<'booking_requests'>
  export type SpecialistReferral = Tables<'specialist_referrals'>
`;

fs.writeFileSync('src/lib/types/database.types.ts', types + append);
console.log('Done!');
