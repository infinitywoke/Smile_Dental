const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  "http://127.0.0.1:54321",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'dr.ananya@smiledental.test',
    password: 'password123',
  });
  console.log("Auth Error:", error);
  console.log("Auth Data:", data?.user?.email);
}

test();
