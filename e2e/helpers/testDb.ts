import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:64321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const TENANT_SMILE = '11111111-1111-1111-1111-111111111111';
export const TENANT_BOB = '22222222-2222-2222-2222-222222222222';

export async function createTestPatient(tenantId: string, name: string, phone?: string) {
  const generatedPhone = phone || Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const { data, error } = await adminClient
    .from('patients')
    .insert({
      tenant_id: tenantId,
      name,
      phone: generatedPhone,
      city: 'Udupi',
      location: 'City Center'
    })
    .select('*')
    .single();

  if (error) throw new Error(`createTestPatient failed: ${error.message}`);
  return data;
}

let apptMinuteOffset = 0;

export async function createTestAppointment(options: {
  tenantId: string;
  patientId: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  updatedAt?: string;
  assignedSpecialist?: string;
}) {
  let start = options.scheduledStart;
  let end = options.scheduledEnd;
  
  if (!start) {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    d.setMinutes(apptMinuteOffset);
    apptMinuteOffset += 1; // Even 1 minute offset makes them look distinct on screen, but to avoid double booking we use a random specialist
    start = d.toISOString();
    end = new Date(d.getTime() + 30 * 60000).toISOString();
  } else if (!end) {
    end = new Date(new Date(start).getTime() + 30 * 60000).toISOString();
  }

  // Use a random specialist to bypass the double-booking constraint for generic mock tests, 
  // unless the test explicitly provided one (or provided null).
  let specialist = options.assignedSpecialist;
  if (options.assignedSpecialist === undefined) {
    specialist = crypto.randomUUID();
  }

  const { data, error } = await adminClient
    .from('appointments')
    .insert({
      tenant_id: options.tenantId,
      patient_id: options.patientId,
      status: options.status,
      reason: options.reason || 'General Checkup',
      scheduled_start: start,
      scheduled_end: end,
      booking_source: 'WALK_IN',
      updated_at: options.updatedAt || new Date().toISOString(),
      assigned_specialist: specialist
    })
    .select('*')
    .single();

  if (error) throw new Error(`createTestAppointment failed: ${error.message}`);
  return data;
}

export async function createTestClinicalRecord(options: {
  tenantId: string;
  patientId: string;
  appointmentId: string;
  chiefComplaint?: string;
  diagnosis?: string;
}) {
  const { data, error } = await adminClient
    .from('clinical_records')
    .insert({
      tenant_id: options.tenantId,
      patient_id: options.patientId,
      appointment_id: options.appointmentId,
      created_by: '10000000-0000-0000-0000-000000000001',
      chief_complaint: options.chiefComplaint || 'Tooth ache',
      diagnosis: options.diagnosis || 'Caries',
      procedure_summary: 'Cleaned and restored',
      advice: 'Brush twice daily'
    })
    .select('*')
    .single();

  if (error) throw new Error(`createTestClinicalRecord failed: ${error.message}`);
  return data;
}

export async function createTestTreatmentPlan(options: {
  tenantId: string;
  patientId: string;
  name: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}) {
  const { data, error } = await adminClient
    .from('treatment_plans')
    .insert({
      tenant_id: options.tenantId,
      patient_id: options.patientId,
      name: options.name,
      status: options.status || 'ACTIVE'
    })
    .select('*')
    .single();

  if (error) throw new Error(`createTestTreatmentPlan failed: ${error.message}`);
  return data;
}

export async function createTestTreatmentItem(options: {
  planId: string;
  procedure: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  cost?: number;
  tooth?: string;
}) {
  const { data, error } = await adminClient
    .from('treatment_items')
    .insert({
      treatment_plan_id: options.planId,
      procedure: options.procedure,
      status: options.status,
      estimated_cost: options.cost ?? 500,
      tooth_number: options.tooth || '14',
      completed_at: options.status === 'COMPLETED' ? new Date().toISOString() : null
    })
    .select('*')
    .single();

  if (error) throw new Error(`createTestTreatmentItem failed: ${error.message}`);
  return data;
}

export async function createTestReferral(options: {
  tenantId: string;
  patientId: string;
  specialistName: string;
  reason: string;
  status: 'PENDING_ADVANCE' | 'ADVANCE_PAID' | 'SCHEDULED' | 'COMPLETED';
  estimatedCost?: number;
  advancePercentage?: number;
}) {
  const cost = options.estimatedCost || 2000;
  const advance = (cost * (options.advancePercentage || 50)) / 100;

  const { data, error } = await adminClient
    .from('specialist_referrals')
    .insert({
      tenant_id: options.tenantId,
      patient_id: options.patientId,
      specialist_name: options.specialistName,
      reason: options.reason,
      estimated_cost: cost,
      advance_percentage: options.advancePercentage || 50,
      advance_required: advance,
      status: options.status,
      created_by: '10000000-0000-0000-0000-000000000001'
    })
    .select('*')
    .single();

  if (error) throw new Error(`createTestReferral failed: ${error.message}`);
  return data;
}

export async function createTestBookingRequest(options: {
  tenantId: string;
  name: string;
  phone: string;
  reason?: string;
  status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'DECLINED' | 'CANCELLED';
}) {
  const { data, error } = await adminClient
    .from('booking_requests')
    .insert({
      tenant_id: options.tenantId,
      name: options.name,
      phone: options.phone,
      reason: options.reason || 'Tooth sensitivity',
      preferred_date: new Date().toISOString().split('T')[0],
      preferred_time: '10:00',
      status: options.status || 'NEW'
    })
    .select('*')
    .single();

  if (error) throw new Error(`createTestBookingRequest failed: ${error.message}`);
  return data;
}

export async function createTestPayment(options: {
  tenantId: string;
  patientId: string;
  amount: number;
  planId?: string;
  itemId?: string;
}) {
  const { data, error } = await adminClient
    .from('payments')
    .insert({
      tenant_id: options.tenantId,
      patient_id: options.patientId,
      amount: options.amount,
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: 'CASH',
      treatment_plan_id: options.planId || null,
      treatment_item_id: options.itemId || null
    })
    .select('*')
    .single();

  if (error) throw new Error(`createTestPayment failed: ${error.message}`);
  return data;
}

export async function cleanupTestData(patientIds: string[]) {
  if (!patientIds || patientIds.length === 0) return;
  const { error } = await adminClient.rpc('cleanup_test_data', { patient_ids: patientIds });
  if (error) {
    console.error('cleanupTestData RPC error, falling back to JS:', error.message);
    await adminClient.from('clinical_records').delete().in('patient_id', patientIds);
    
    const { data: plans } = await adminClient.from('treatment_plans').select('id').in('patient_id', patientIds);
    if (plans && plans.length > 0) {
      const planIds = plans.map(p => p.id);
      // Reset status to bypass the prevent_completed_item_delete trigger
      await adminClient.from('treatment_items').update({ status: 'PLANNED' }).in('treatment_plan_id', planIds);
      await adminClient.from('treatment_items').delete().in('treatment_plan_id', planIds);
    }
    
    // Also reset appointment status to bypass the appointment terminal state trigger (Phase 6)
    await adminClient.from('appointments').update({ status: 'SCHEDULED' }).in('patient_id', patientIds);
    await adminClient.from('treatment_plans').delete().in('patient_id', patientIds);
    await adminClient.from('specialist_referrals').delete().in('patient_id', patientIds);
    await adminClient.from('payments').delete().in('patient_id', patientIds);
    await adminClient.from('appointments').delete().in('patient_id', patientIds);
    await adminClient.from('patients').delete().in('id', patientIds);
  }
}
