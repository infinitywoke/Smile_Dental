const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:64321', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');

async function testUpdate() {
  const { data: appt } = await supabase.from('appointments').select('*').limit(1).single();
  
  // Set to IN_PROGRESS
  await supabase.from('appointments').update({ status: 'IN_PROGRESS' }).eq('id', appt.id);
  
  // Try to update time
  const newStart = new Date(appt.scheduled_start);
  newStart.setHours(newStart.getHours() + 1);
  const newEnd = new Date(appt.scheduled_end);
  newEnd.setHours(newEnd.getHours() + 1);
  
  const { data, error } = await supabase
    .from('appointments')
    .update({ scheduled_start: newStart.toISOString(), scheduled_end: newEnd.toISOString() })
    .eq('id', appt.id)
    .select();
    
  console.log("Update error:", error);
}

testUpdate();
