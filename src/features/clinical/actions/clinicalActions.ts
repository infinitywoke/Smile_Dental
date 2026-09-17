'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { ToothInput } from '../services/clinicalService'

export async function saveConsultationAction(formData: FormData) {
  const supabase = await createClient()

  const appointmentId = formData.get('appointment_id') as string
  const chiefComplaint = formData.get('chief_complaint') as string || null
  const diagnosis = formData.get('diagnosis') as string || null
  const procedureSummary = formData.get('procedure_summary') as string || null
  const advice = formData.get('advice') as string || null
  const medications = formData.get('medications') as string || null
  const teethJson = formData.get('teeth') as string

  let teeth: ToothInput[] = []
  if (teethJson) {
    try {
      teeth = JSON.parse(teethJson)
    } catch (e) {
      return { error: 'Invalid tooth data format' }
    }
  }

  // Use the postgres RPC we created for atomic operation
  const { data, error } = await supabase.rpc('save_consultation', {
    p_appointment_id: appointmentId,
    p_chief_complaint: chiefComplaint,
    p_diagnosis: diagnosis,
    p_procedure_summary: procedureSummary,
    p_advice: advice,
    p_medications: medications,
    p_teeth: teeth
  })

  if (error) {
    console.error('Error saving consultation:', error)
    return { error: error.message || 'Failed to save consultation.' }
  }

  revalidatePath(`/dashboard/appointments/${appointmentId}`)
  revalidatePath(`/dashboard/appointments/${appointmentId}/consultation`)
  
  return { success: true, recordId: data }
}

export async function completeVisitAction(appointmentId: string) {
  const supabase = await createClient()

  // 1. Check current status
  const { data: appt, error: apptError } = await supabase
    .from('appointments')
    .select('status')
    .eq('id', appointmentId)
    .single()

  if (apptError || !appt) {
    return { error: 'Appointment not found' }
  }

  if (appt.status === 'CANCELLED' || appt.status === 'NO_SHOW') {
    return { error: 'Cannot complete a cancelled or no-show appointment' }
  }

  // 2. Ensure clinical record exists
  const { data: record, error: recError } = await supabase
    .from('clinical_records')
    .select('id')
    .eq('appointment_id', appointmentId)
    .single()

  if (recError || !record) {
    return { error: 'Cannot complete appointment without a saved clinical record' }
  }

  // 3. Update status
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'COMPLETED' })
    .eq('id', appointmentId)

  if (error) {
    console.error('Error completing visit:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/appointments/${appointmentId}`)
  revalidatePath('/dashboard')
  redirect(`/dashboard/appointments/${appointmentId}`)
}
