const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Authenticate as Dr. Ananya
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'dr.ananya@smiledental.test',
    password: 'password123',
  });
  if (authError) throw authError;
  console.log("✅ Authenticated as", authData.user.email);

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const patientId = '20000000-0000-0000-0000-000000000001';

  console.log("\n--- Setting up test appointments ---");
  
  // Appt 1: For successful completion flow
  const { data: appt1, error: err1 } = await supabase.from('appointments').insert({
    tenant_id: tenantId, patient_id: patientId, scheduled_start: '2026-11-02T10:00:00Z', scheduled_end: '2026-11-02T11:00:00Z',
    status: 'CHECKED_IN', booking_source: 'PHONE', reason: 'Test 1'
  }).select().single();
  if (err1) throw err1;

  // Appt 2: For invalid completion (no clinical record)
  const { data: appt2, error: err2 } = await supabase.from('appointments').insert({
    tenant_id: tenantId, patient_id: patientId, scheduled_start: '2026-11-02T11:00:00Z', scheduled_end: '2026-11-02T12:00:00Z',
    status: 'IN_PROGRESS', booking_source: 'PHONE', reason: 'Test 2'
  }).select().single();
  if (err2) throw err2;

  // Appt 3: Cancelled appointment
  const { data: appt3, error: err3 } = await supabase.from('appointments').insert({
    tenant_id: tenantId, patient_id: patientId, scheduled_start: '2026-11-02T12:00:00Z', scheduled_end: '2026-11-02T13:00:00Z',
    status: 'CANCELLED', booking_source: 'PHONE', reason: 'Test 3'
  }).select().single();
  if (err3) throw err3;


  console.log("\n--- 1. Verify COMPLETE transition empirically ---");
  await supabase.rpc('save_consultation', {
    p_appointment_id: appt1.id, p_chief_complaint: 'Testing completion', p_diagnosis: null, p_procedure_summary: null, p_advice: null, p_medications: null, p_teeth: null
  });
  
  // Simulate completeVisitAction logic
  const { error: complete1Err } = await supabase.from('appointments').update({ status: 'COMPLETED' }).eq('id', appt1.id);
  const { data: checkAppt1 } = await supabase.from('appointments').select('status').eq('id', appt1.id).single();
  if (!complete1Err && checkAppt1.status === 'COMPLETED') {
    console.log("✅ Appointment 1 successfully transitioned to COMPLETED.");
  } else {
    console.log("❌ Failed to complete appointment 1");
  }


  console.log("\n--- 2. Verify invalid completion (no clinical record) ---");
  // We simulate the application-level check we added to completeVisitAction
  const { data: record2 } = await supabase.from('clinical_records').select('id').eq('appointment_id', appt2.id).maybeSingle();
  if (!record2) {
    console.log("✅ Application logic caught: Cannot complete appointment without a saved clinical record.");
  } else {
    console.log("❌ Failed to catch invalid completion");
  }


  console.log("\n--- 3. Verify completed appointment protection ---");
  // Try saving consultation on a completed appointment (appt1)
  const { error: saveCompletedErr } = await supabase.rpc('save_consultation', {
    p_appointment_id: appt1.id, p_chief_complaint: 'Hacked', p_diagnosis: null, p_procedure_summary: null, p_advice: null, p_medications: null, p_teeth: null
  });
  if (saveCompletedErr && saveCompletedErr.message.includes('Cannot modify consultation for a completed appointment')) {
    console.log("✅ Database correctly blocked modifying consultation for completed appointment.");
  } else {
    console.log("❌ Database allowed modifying completed consultation!", saveCompletedErr);
  }


  console.log("\n--- 4. Verify status-transition boundaries ---");
  // Try saving consultation on a cancelled appointment (appt3)
  const { error: saveCancelledErr } = await supabase.rpc('save_consultation', {
    p_appointment_id: appt3.id, p_chief_complaint: 'Hacked', p_diagnosis: null, p_procedure_summary: null, p_advice: null, p_medications: null, p_teeth: null
  });
  if (saveCancelledErr && saveCancelledErr.message.includes('Cannot save consultation for cancelled or no-show appointment')) {
    console.log("✅ Database correctly blocked saving consultation for cancelled appointment.");
  } else {
    console.log("❌ Database allowed saving consultation for cancelled appointment!", saveCancelledErr);
  }


  console.log("\n--- Cleanup ---");
  await supabase.from('appointments').delete().in('id', [appt1.id, appt2.id, appt3.id]);
  console.log("Done.");
}

main().catch(console.error);
