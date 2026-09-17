const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://gwqxtzwfxyyyrvarobee.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3cXh0endmeHl5eXJ2YXJvYmVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTYxMjQwNCwiZXhwIjoyMTA1MTg4NDA0fQ.In5txkg8ePx5ZlSf0mdr0E7QNTFGAhxfbNjjpMpnPKs';
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });
async function main() {
  const email = 'smiledental8925@gmail.com';
  const password = 'Rahil@Smile!';
  console.log('Creating auth user...');
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
  if (authErr && !authErr.message.includes('already registered')) { console.error('Error creating auth user:', authErr); return; }
  let userId = authData?.user?.id;
  if (!userId) { const { data: usersData } = await supabase.auth.admin.listUsers(); userId = usersData.users.find(u => u.email === email).id; }
  console.log('Creating tenant...');
  const { data: tenantData, error: tenantErr } = await supabase.from('tenants').insert({ name: 'Smile Dental Clinic' }).select('*').single();
  if (tenantErr) { console.error('Error creating tenant:', tenantErr); return; }
  console.log('Creating app user profile...');
  const { error: profileErr } = await supabase.from('users').insert({ id: userId, tenant_id: tenantData.id, email: email, role: 'DENTIST' });
  if (profileErr) { console.error('Error creating app profile:', profileErr); return; }
  console.log('SUCCESS! Admin user created successfully.');
}
main();
