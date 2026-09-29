import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})
const supabase = createClient(supabaseUrl, supabaseKey)

async function runTests() {
  console.log('Starting Phase 5 Runtime E2E Tests...')
  
  const userA_email = 'tenantA_' + Date.now() + '@example.com'
  const userB_email = 'tenantB_' + Date.now() + '@example.com'
  
  const { data: authA } = await adminClient.auth.admin.createUser({ email: userA_email, password: 'password', email_confirm: true })
  const { data: authB } = await adminClient.auth.admin.createUser({ email: userB_email, password: 'password', email_confirm: true })
  
  const { data: tenA } = await adminClient.from('tenants').insert({ name: 'Clinic A' }).select().single()
  const { data: tenB } = await adminClient.from('tenants').insert({ name: 'Clinic B' }).select().single()
  
  await adminClient.from('users').insert({ id: (authA?.user?.id as string), tenant_id: tenA.id, email: userA_email, role: 'ADMIN' })
  await adminClient.from('users').insert({ id: (authB?.user?.id as string), tenant_id: tenB.id, email: userB_email, role: 'ADMIN' })

  const loginAs = async (email: string) => {
    const { data } = await supabase.auth.signInWithPassword({ email, password: 'password' })
    return data.session
  }

  await loginAs(userA_email)
  const { data: patientA, error: pErrA } = await supabase.from('patients').insert({ name: 'Patient A', tenant_id: tenA.id }).select().single()
  if (pErrA) throw pErrA

  const { data: planA1 } = await supabase.from('treatment_plans').insert({ patient_id: patientA.id, tenant_id: tenA.id, name: 'Plan 1', status: 'ACTIVE' }).select().single()
  await supabase.from('treatment_items').insert({ treatment_plan_id: planA1.id, procedure: 'Consultation', estimated_cost: 200, status: 'PLANNED' })

  await loginAs(userB_email)
  const { data: patientB, error: pErrB } = await supabase.from('patients').insert({ name: 'Patient B', tenant_id: tenB.id }).select().single()
  if (pErrB) throw pErrB

  const { data: planB1 } = await supabase.from('treatment_plans').insert({ patient_id: patientB.id, tenant_id: tenB.id, name: 'Plan 2', status: 'COMPLETED' }).select().single()
  await supabase.from('treatment_items').insert({ treatment_plan_id: planB1.id, procedure: 'Filling', estimated_cost: 500, status: 'COMPLETED' })
  const { error: payErr } = await supabase.from('payments').insert({ patient_id: patientB.id, tenant_id: tenB.id, amount: 100, payment_mode: 'CASH', payment_date: new Date().toISOString() }); if (payErr) console.error('PAYMENT ERROR:', payErr)

  console.log('\n--- RUNNING ASSERTIONS ---')
  await loginAs(userA_email)
  const { data: balancesA, error: errA } = await supabase.from('patient_financial_balances').select('*'); if (errA) console.error(errA)
  console.log('Tenant A View Results:', balancesA)
  if (balancesA!.length !== 1 || balancesA![0].patient_id !== patientA.id || balancesA![0].balance !== 200) {
    console.error('FAILED FOR A')
  } else {
    console.log('✅ Tenant A PASS')
  }

  await loginAs(userB_email)
  const { data: balancesB, error: errB } = await supabase.from('patient_financial_balances').select('*'); if (errB) console.error(errB)
  console.log('Tenant B View Results:', balancesB)
  if (balancesB!.length !== 1 || balancesB![0].patient_id !== patientB.id || balancesB![0].balance !== 400) {
    console.error('FAILED FOR B')
  } else {
    console.log('✅ Tenant B PASS')
  }
  process.exit(0)
}
runTests().catch(console.error)
