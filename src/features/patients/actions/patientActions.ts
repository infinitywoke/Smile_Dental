'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPatient(formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const date_of_birth = formData.get('date_of_birth') as string
  const location = formData.get('location') as string
  const city = formData.get('city') as string
  const address = formData.get('address') as string

  if (!name) {
    return { error: 'Name is required' }
  }

  const supabase = await createClient()

  // Verify the user has a valid tenant_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // We fetch tenant_id from the users table
  const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
  if (!userData?.tenant_id) return { error: 'No tenant found for user' }

  // Allow duplicate phone numbers for family members by default for MVP
  // Removed explicit manual warning check to streamline workflow.
  
  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      tenant_id: userData.tenant_id,
      name: name.trim(),
      phone: phone?.trim() || null,
      date_of_birth: date_of_birth || null,
      location: location?.trim() || null,
      city: city?.trim() || null,
      address: address?.trim() || null
    })
    .select('id')
    .single()

  if (error) {
    console.error("Failed to create patient", error)
    return { error: 'Failed to create patient in database.' }
  }

  revalidatePath('/dashboard/patients')
  redirect(`/dashboard/patients/${patient.id}`)
}

export async function updatePatient(id: string, formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const date_of_birth = formData.get('date_of_birth') as string
  const location = formData.get('location') as string
  const city = formData.get('city') as string
  const address = formData.get('address') as string

  if (!name) {
    return { error: 'Name is required' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('patients')
    .update({
      name: name.trim(),
      phone: phone?.trim() || null,
      date_of_birth: date_of_birth || null,
      location: location?.trim() || null,
      city: city?.trim() || null,
      address: address?.trim() || null
    })
    .eq('id', id)

  if (error) {
    console.error("Failed to update patient", error)
    return { error: 'Failed to update patient.' }
  }

  revalidatePath(`/dashboard/patients/${id}`)
  revalidatePath('/dashboard/patients')
  redirect(`/dashboard/patients/${id}`)
}
