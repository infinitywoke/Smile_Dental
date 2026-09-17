'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSpecialistReferral(formData: FormData) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Not authenticated' }

  const { data: userRow } = await supabase.from('users').select('tenant_id').eq('id', userData.user.id).single()
  const tenant_id = userRow?.tenant_id
  if (!tenant_id) return { error: 'Tenant not found' }

  const patient_id = formData.get('patient_id') as string
  const specialist_name = formData.get('specialist_name') as string
  const reason = formData.get('reason') as string
  const estimated_cost = parseFloat(formData.get('estimated_cost') as string)
  const advance_percentage = parseFloat(formData.get('advance_percentage') as string || '50')
  
  if (isNaN(estimated_cost) || estimated_cost <= 0) return { error: 'Invalid estimated cost' }

  const advance_required = (estimated_cost * advance_percentage) / 100

  const { error } = await supabase
    .from('specialist_referrals')
    .insert({
      tenant_id,
      patient_id,
      specialist_name,
      reason,
      estimated_cost,
      advance_percentage,
      advance_required,
      status: 'PENDING_ADVANCE',
      created_by: userData.user.id
    })

  if (error) return { error: error.message }
  
  revalidatePath(`/dashboard/patients/${patient_id}`)
  return { success: true }
}

export async function getPatientSpecialistReferrals(patientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('specialist_referrals')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching referrals:", error)
    return []
  }
  return data
}

export async function cancelSpecialistReferral(referralId: string, patientId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('specialist_referrals')
    .update({ status: 'CANCELLED' })
    .eq('id', referralId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
