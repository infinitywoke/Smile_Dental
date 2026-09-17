import { createClient } from '@/utils/supabase/server'
import { Appointment } from '@/lib/types/database.types'

export async function getAppointments(startDate: Date, endDate: Date) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_start,
      scheduled_end,
      status,
      reason,
      booking_source,
      patient_id,
      assigned_specialist,
      notes,
      patients (id, name, phone)
    `)
    .gte('scheduled_start', startDate.toISOString())
    .lt('scheduled_start', endDate.toISOString())
    .order('scheduled_start', { ascending: true })

  if (error) {
    console.error("Failed to fetch appointments:", error)
    throw new Error("Failed to fetch appointments")
  }

  return data as unknown as Appointment[]
}

export async function getAppointment(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      patients (id, name, phone)
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data as unknown as Appointment & { notes?: string, assigned_specialist?: string }
}
