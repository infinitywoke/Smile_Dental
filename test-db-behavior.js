const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. Authenticate as Dr. Ananya
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'dr.ananya@smiledental.test',
    password: 'password123',
  });
  
  if (authError) throw authError;
  console.log("✅ Authenticated as", authData.user.email);

  const tenantId = '11111111-1111-1111-1111-111111111111'; // Smile Dental Clinic MVP

  // 2. Test Double Booking Constraint (Phase 6)
  console.log("\n--- Testing Double Booking Exclusion Constraint ---");
  // Dr. Ananya already has an appointment 2026-09-11 09:00 to 10:00. Let's try booking exactly at the same time.
  const { error: overlapError } = await supabase.from('appointments').insert({
    tenant_id: tenantId,
    patient_id: '20000000-0000-0000-0000-000000000002',
    scheduled_start: '2026-09-11T09:30:00Z',
    scheduled_end: '2026-09-11T10:30:00Z',
    status: 'SCHEDULED',
    booking_source: 'PHONE',
    reason: 'Test Double Book'
  });

  if (overlapError) {
    if (overlapError.code === '23P01') {
      console.log("✅ Double booking successfully prevented by database constraint.");
    } else {
      console.log("❌ Unexpected error code:", overlapError);
    }
  } else {
    console.log("❌ FAIL: Double booking was allowed by the database!");
  }

  // 3. Test RLS
  console.log("\n--- Testing Row Level Security ---");
  // Try inserting data into another tenant.
  const fakeTenant = '22222222-2222-2222-2222-222222222222';
  const { error: rlsError } = await supabase.from('patients').insert({
    tenant_id: fakeTenant,
    name: 'Hacker',
    phone: '000-0000'
  });

  if (rlsError) {
    console.log("✅ RLS correctly prevented inserting data for another tenant:", rlsError.message);
  } else {
    console.log("❌ FAIL: RLS allowed inserting data into another tenant!");
  }
}

main().catch(console.error);
