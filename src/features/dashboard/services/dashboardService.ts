import { createClient } from '@/utils/supabase/server'
import { Appointment, BookingRequest, Patient } from '@/lib/types/database.types'

export async function getDashboardData() {
  const supabase = await createClient()

  // Get today's start and end in UTC (simplification for MVP without strict timezone handling yet)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 1. Get today's appointments
  const { data: todaysAppointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select(`
      id, 
      scheduled_start, 
      scheduled_end, 
      status, 
      reason, 
      booking_source,
      patient_id,
      patients (id, name, phone)
    `)
    .gte('scheduled_start', today.toISOString())
    .lt('scheduled_start', tomorrow.toISOString())
    .order('scheduled_start', { ascending: true })

  // 2. Get pending booking requests
  const { data: pendingRequests, error: requestsError } = await supabase
    .from('booking_requests')
    .select('*')
    .in('status', ['NEW', 'CONTACTED'])
    .order('created_at', { ascending: false })
    .limit(10)

  // 3. Get recent patients (patients with appointments recently)
  const { data: recentPatients, error: patientsError } = await supabase
    .from('patients')
    .select('id, name, phone')
    .order('created_at', { ascending: false })
    .limit(5)

  // 4. Get upcoming appointments (next 7 days, excluding today)
  const { data: upcomingAppointments, error: upcomingError } = await supabase
    .from('appointments')
    .select(`
      id, 
      scheduled_start, 
      scheduled_end, 
      status, 
      reason, 
      booking_source,
      patient_id,
      patients (id, name, phone)
    `)
    .gte('scheduled_start', tomorrow.toISOString())
    .order('scheduled_start', { ascending: true })
    .limit(5)

  if (appointmentsError || requestsError || patientsError || upcomingError) {
    console.error("Dashboard Data Fetch Error:", {
      appointmentsError,
      requestsError,
      patientsError,
      upcomingError
    })
    throw new Error("Failed to load dashboard data.")
  }

  return {
    todaysAppointments: (todaysAppointments || []) as unknown as Appointment[],
    pendingRequests: (pendingRequests || []) as unknown as BookingRequest[],
    recentPatients: (recentPatients || []) as unknown as Patient[],
    upcomingAppointments: (upcomingAppointments || []) as unknown as Appointment[],
  }
}
