const { createClient } = require('@supabase/supabase-js')

// Load environment variables manually
const fs = require('fs')
const path = require('path')
const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envConfig = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) envConfig[match[1]] = match[2].trim()
})

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL'].replace(/"/g, '')
const supabaseKey = envConfig['NEXT_PUBLIC_SUPABASE_ANON_KEY'].replace(/"/g, '')
const supabase = createClient(supabaseUrl, supabaseKey)

async function runTests() {
  // Login as dr.ananya
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'dr.ananya@smiledental.test',
    password: 'password123'
  })

  if (authError) {
    console.error('❌ Failed to authenticate:', authError)
    process.exit(1)
  }

  console.log(`✅ Authenticated as ${authData.user.email}\n`)

  // Get a patient ID (Rahul)
  const { data: patient } = await supabase.from('patients').select('id, name, tenant_id').eq('name', 'Rahul Gupta').single()

  console.log('--- 1. Create treatment plan ---')
  const { data: plan, error: planError } = await supabase.from('treatment_plans').insert({
    tenant_id: patient.tenant_id,
    patient_id: patient.id,
    name: 'Full treatment plan - Sep 2026',
    notes: 'Initial plan for RCT and Crown'
  }).select('id').single()

  if (planError) {
    console.error('❌ Failed to create treatment plan:', planError)
  } else {
    console.log('✅ Created treatment plan')
  }

  console.log('\n--- 2. Add multiple treatment items ---')
  const itemsToInsert = [
    { treatment_plan_id: plan.id, procedure: 'RCT', tooth_number: '46', estimated_cost: 6000, status: 'PLANNED' },
    { treatment_plan_id: plan.id, procedure: 'Crown', tooth_number: '46', estimated_cost: 8000, status: 'PLANNED' },
    { treatment_plan_id: plan.id, procedure: 'Scaling', tooth_number: null, estimated_cost: 1000, status: 'PLANNED' }
  ]

  const { data: items, error: itemsError } = await supabase.from('treatment_items').insert(itemsToInsert).select('id, procedure, estimated_cost')
  
  if (itemsError) {
    console.error('❌ Failed to create treatment items:', itemsError)
  } else {
    console.log(`✅ Created ${items.length} treatment items`)
  }

  console.log('\n--- 3. Treatment status transition ---')
  const rctItem = items.find(i => i.procedure === 'RCT')
  const { error: updateError1 } = await supabase.from('treatment_items').update({ status: 'IN_PROGRESS' }).eq('id', rctItem.id)
  if (updateError1) console.error('❌ Failed to set IN_PROGRESS:', updateError1)
  else console.log('✅ Status updated: PLANNED → IN_PROGRESS')

  const { error: updateError2 } = await supabase.from('treatment_items').update({ status: 'COMPLETED' }).eq('id', rctItem.id)
  if (updateError2) console.error('❌ Failed to set COMPLETED:', updateError2)
  else console.log('✅ Status updated: IN_PROGRESS → COMPLETED')

  console.log('\n--- 4. Plan totals ---')
  const { data: planItems } = await supabase.from('treatment_items').select('estimated_cost').eq('treatment_plan_id', plan.id)
  const total = planItems.reduce((acc, i) => acc + Number(i.estimated_cost), 0)
  if (total === 15000) {
    console.log(`✅ Plan total is correct: ₹${total}`)
  } else {
    console.error(`❌ Plan total is incorrect: ₹${total}`)
  }

  console.log('\n--- 5. Multiple plans ---')
  const { data: plan2, error: plan2Error } = await supabase.from('treatment_plans').insert({
    tenant_id: patient.tenant_id,
    patient_id: patient.id,
    name: 'Follow-up restoration',
    status: 'ACTIVE'
  }).select('id').single()
  if (plan2Error) console.error('❌ Failed to create second plan:', plan2Error)
  else console.log('✅ Created multiple plans for the same patient')

  console.log('\n--- 6. Completed treatment protection (Deletion) ---')
  const { error: deleteError, count } = await supabase.from('treatment_items').delete({ count: 'exact' }).eq('id', rctItem.id)
  if (deleteError) {
    console.log('✅ Application/DB successfully blocked deletion of COMPLETED item (Trigger):', deleteError.message)
  } else if (count === 0) {
    console.log('✅ Application/DB successfully blocked deletion of COMPLETED item (RLS). Count = 0')
  } else {
    console.error('❌ DB allowed deletion of COMPLETED item! count:', count)
  }

  console.log('\n--- 7. Completed treatment protection (Modification) ---')
  const { error: modifyError } = await supabase.from('treatment_items').update({ procedure: 'Changed' }).eq('id', rctItem.id)
  if (modifyError) {
    console.log('✅ Application/DB successfully blocked modification of COMPLETED item clinical details:', modifyError.message)
  } else {
    console.log('❌ DB allowed modification of COMPLETED item clinical details! Wait, did it? Let us check.')
    const { data: verifyItem } = await supabase.from('treatment_items').select('procedure').eq('id', rctItem.id).single()
    if (!verifyItem) console.log('Item is missing!')
    else console.log('Procedure is now:', verifyItem.procedure)
  }

  // Cross-tenant test would require another user. Let's rely on standard RLS testing.
  
  console.log('\n--- Done ---')
  process.exit(0)
}

runTests()
