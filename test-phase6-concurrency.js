const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function runTests() {
  console.log('--- Phase 6: Adversarial Concurrency Tests ---');
  
  const tenantRes = await supabase.from('tenants').insert({ name: 'Clinic A' }).select('id').single();
  const tenantId = tenantRes.data.id;
  
  const pRes = await supabase.from('patients').insert({ tenant_id: tenantId, name: 'Concur Patient', phone: '123' }).select('id').single();
  const patientId = pRes.data.id;

  // 1. Case B: Double Booking (Concurrency)
  console.log('\nTesting Case B: Double Booking');
  const start = new Date(Date.now() + 86400000); start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 3600000);

  const p1 = supabase.from('appointments').insert({
    tenant_id: tenantId, patient_id: patientId, scheduled_start: start.toISOString(), scheduled_end: end.toISOString(), status: 'SCHEDULED', reason: 'R1', booking_source: 'PHONE'
  }).select('id');
  const p2 = supabase.from('appointments').insert({
    tenant_id: tenantId, patient_id: patientId, scheduled_start: start.toISOString(), scheduled_end: end.toISOString(), status: 'SCHEDULED', reason: 'R2', booking_source: 'PHONE'
  }).select('id');

  const results = await Promise.all([p1, p2]);
  const successes = results.filter(r => !r.error);
  const errors = results.filter(r => r.error);

  if (successes.length !== 1 || errors.length !== 1) throw new Error('Case B failed');
  if (errors[0].error.code !== '23P01') throw new Error('Expected 23P01, got: ' + errors[0].error.code);
  console.log('Case B: Passed (23P01)');
  const apptId = successes[0].data[0].id;

  // 2. Temporal constraints
  console.log('\nTesting Temporal Constraints');
  const emptyRes = await supabase.from('appointments').insert({
    tenant_id: tenantId, patient_id: patientId, scheduled_start: start.toISOString(), scheduled_end: start.toISOString(), status: 'SCHEDULED', reason: 'R3', booking_source: 'PHONE'
  });
  if (!emptyRes.error || emptyRes.error.code !== '23514') throw new Error('Expected 23514 for zero-duration appt');
  console.log('Temporal Constraints: Passed (23514)');

  // 3. Terminal State / Clinical Record Atomicity
  console.log('\nTesting COMPLETED Atomicity');
  const completeRes = await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', apptId);
  if (!completeRes.error || completeRes.error.code !== 'P0001') throw new Error('Expected P0001 for COMPLETED without record');
  console.log('COMPLETED Atomicity: Passed (P0001)');

  console.log('\n--- All Phase 6 Tests Passed ---');
}

runTests().catch(e => { console.error(e); process.exit(1); });
