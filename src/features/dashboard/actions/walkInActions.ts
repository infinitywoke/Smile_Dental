'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getPatients } from '@/features/patients/services/patientService'

export async function searchPatientsAction(query: string) {
  return await getPatients(query)
}

export async function processWalkInAction(formData: FormData) {
  const supabase = await createClient()

  // 1. Determine if existing or new patient
  const patientId = formData.get('patient_id') as string | null
  
  let finalPatientId = patientId

  // 2. If new patient, create them first
  if (!finalPatientId) {
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    
    if (!name) {
      return { error: 'Patient name is required.' }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!userData?.tenant_id) return { error: 'No tenant found for user' }

    const { data: newPatient, error: patientError } = await supabase
      .from('patients')
      .insert({
        tenant_id: userData.tenant_id,
        name: name.trim(),
        phone: phone?.trim() || null,
      })
      .select('id')
      .single()

    if (patientError) {
      console.error("Walk-in patient creation error:", patientError)
      return { error: 'Failed to create new patient record.' }
    }

    finalPatientId = newPatient.id
  }

  // 3. Create the Walk-In Appointment
  const reason = formData.get('reason') as string || 'Walk-In Consultation'
  
  // Set for right now, 30 min duration
  const start = new Date()
  const end = new Date(start.getTime() + 30 * 60000)

  const { data: { user } } = await supabase.auth.getUser()
  const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user?.id).single()

  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert({
      tenant_id: userData?.tenant_id, // If not new, we might still need this. Re-fetching is fine.
      patient_id: finalPatientId,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      status: 'CHECKED_IN',
      reason: reason.trim(),
      booking_source: 'WALK_IN'
    })
    .select('id')
    .single()

  if (appointmentError) {
    console.error("Walk-in appointment creation error:", appointmentError)
    return { error: 'Failed to create the walk-in appointment.' }
  }

  // 4. Redirect to Dashboard (where they will see the patient waiting) 
  // or redirect to Encounter directly? "The goal is to let the dentist find the right patient and understand their current state without navigating through multiple pages."
  // Dashboard is fine, it will appear under "Waiting Room". Or even better, redirect to the Consultation Hub directly if we want instant start.
  // The requirements say "Start Visit". We'll just put them in the Waiting Room, which returns them to the cockpit.
  redirect('/dashboard')
}
