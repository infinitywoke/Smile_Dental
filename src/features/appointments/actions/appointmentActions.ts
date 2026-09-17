'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AppointmentStatus } from '@/lib/types/database.types'

export async function createAppointment(formData: FormData) {
  const patient_id = formData.get('patient_id') as string
  const date = formData.get('date') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const reason = formData.get('reason') as string
  const booking_source = formData.get('booking_source') as string
  const notes = formData.get('notes') as string
  const assigned_specialist = formData.get('assigned_specialist') as string
  const specialist_referral_id = formData.get('specialist_referral_id') as string | null

  if (!patient_id || !date || !start_time || !end_time || !reason) {
    return { error: 'Missing required fields' }
  }

  const scheduled_start = new Date(`${date}T${start_time}`).toISOString()
  const scheduled_end = new Date(`${date}T${end_time}`).toISOString()

  if (new Date(scheduled_start) >= new Date(scheduled_end)) {
    return { error: 'End time must be after start time' }
  }

  const supabase = await createClient()

  // Enforce Scheduling Gate
  if (specialist_referral_id) {
    const { data: ref } = await supabase.from('specialist_referrals').select('status').eq('id', specialist_referral_id).single()
    if (!ref) return { error: 'Invalid specialist referral' }
    if (ref.status === 'PENDING_ADVANCE') {
      return { error: 'Specialist appointments require the advance payment to be completed first.' }
    }
  }

  // Get tenant ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
  if (!userData?.tenant_id) return { error: 'No tenant found' }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: userData.tenant_id,
      patient_id,
      scheduled_start,
      scheduled_end,
      status: 'SCHEDULED',
      reason,
      booking_source: booking_source || 'WALK_IN',
      notes: notes || null,
      assigned_specialist: assigned_specialist || null
    })
    .select('id')
    .single()

  if (error) {
    // Check for double booking exclusion constraint
    if (error.message.includes('overlapping') || error.code === '23P01' || error.message.includes('exclude')) {
      return { error: 'That time is already booked. Please choose another time.' }
    }
    console.error("Failed to create appointment", error)
    return { error: 'Failed to create appointment in database.' }
  }

  if (specialist_referral_id && data) {
    await supabase.from('specialist_referrals').update({
      scheduled_appointment_id: data.id,
      status: 'SCHEDULED'
    }).eq('id', specialist_referral_id)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/patients/${patient_id}`)
  redirect(`/dashboard/appointments/${data.id}`)
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus, redirectPath?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error("Failed to update status", error)
    return { error: 'Failed to update status' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/appointments/${id}`)
  if (redirectPath) {
    redirect(redirectPath)
  }
}

export async function updateAppointment(id: string, formData: FormData) {
  const date = formData.get('date') as string
  const start_time = formData.get('start_time') as string
  const end_time = formData.get('end_time') as string
  const reason = formData.get('reason') as string
  const booking_source = formData.get('booking_source') as string
  const notes = formData.get('notes') as string
  const assigned_specialist = formData.get('assigned_specialist') as string

  if (!date || !start_time || !end_time || !reason) {
    return { error: 'Missing required fields' }
  }

  const scheduled_start = new Date(`${date}T${start_time}`).toISOString()
  const scheduled_end = new Date(`${date}T${end_time}`).toISOString()

  if (new Date(scheduled_start) >= new Date(scheduled_end)) {
    return { error: 'End time must be after start time' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('appointments')
    .update({
      scheduled_start,
      scheduled_end,
      reason,
      booking_source: booking_source || 'WALK_IN',
      notes: notes || null,
      assigned_specialist: assigned_specialist || null
    })
    .eq('id', id)

  if (error) {
    if (error.message.includes('overlapping') || error.code === '23P01' || error.message.includes('exclude')) {
      return { error: 'That time is already booked. Please choose another time.' }
    }
    console.error("Failed to update appointment", error)
    return { error: 'Failed to update appointment in database.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/appointments')
  revalidatePath(`/dashboard/appointments/${id}`)
  redirect(`/dashboard/appointments/${id}`)
}
