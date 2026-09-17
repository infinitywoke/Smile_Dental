const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:64321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');

async function testQuery() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'priya.assistant@smiledental.test',
    password: 'password123'
  });
  
  const { data: appts, error: err } = await supabase.from('appointments').select('*');
  console.log('Appts:', appts?.length, 'Err:', err);
}

testQuery();
