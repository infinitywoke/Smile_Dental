const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function setup() {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    '10000000-0000-0000-0000-000000000001',
    { password: 'password123', email_confirm: true }
  );
  console.log("Update user1:", error?.message || "Success");

  const { data: d2, error: e2 } = await supabaseAdmin.auth.admin.updateUserById(
    '10000000-0000-0000-0000-000000000002',
    { password: 'password123', email_confirm: true }
  );
  console.log("Update user2:", e2?.message || "Success");
}

setup();
