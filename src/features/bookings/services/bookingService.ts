import { createClient as createServerClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { Database } from '@/lib/types/database.types'
import { format } from 'date-fns'

export type BookingRequest = Database['public']['Tables']['booking_requests']['Row']
export type BookingRequestStatus = Database['public']['Enums']['booking_request_status']
export type BookingSource = Database['public']['Enums']['booking_source']

export async function submitPublicBookingRequest(data: {
  name: string
  phone: string
  dob?: string
  location?: string
  city?: string
  preferred_date: string
  preferred_time?: string
  reason: string
  notes?: string
  source?: BookingSource
}) {
  const admin = createAdminClient()

  // Find a tenant (for MVP, pick the first one available)
  const { data: tenant } = await admin.from('tenants').select('id').limit(1).single()
  
  if (!tenant) throw new Error('System uninitialized: No tenant found')

  const { data: result, error } = await admin.from('booking_requests').insert({
    tenant_id: tenant.id,
    name: data.name.trim(),
    phone: data.phone.trim(),
    dob: data.dob || null,
    location: data.location?.trim() || null,
    city: data.city?.trim() || null,
    preferred_date: data.preferred_date,
    preferred_time: data.preferred_time || null,
    reason: data.reason.trim(),
    notes: data.notes?.trim() || null,
    source: data.source || 'WEBSITE',
    status: 'NEW'
  }).select().single()

  if (error) throw error
  return result
}

export async function getBookingRequests(status?: BookingRequestStatus[]) {
  const supabase = await createServerClient()
  let query = supabase.from('booking_requests').select('*').order('created_at', { ascending: false })
  
  if (status && status.length > 0) {
    query = query.in('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getBookingRequest(id: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('booking_requests').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function updateBookingRequestStatus(id: string, status: BookingRequestStatus) {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from('booking_requests').update({ status }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function findPotentialPatientMatch(phone: string) {
  const supabase = await createServerClient()
  const cleanPhone = phone.trim()
  const { data, error } = await supabase.from('patients').select('id, name, phone, date_of_birth').eq('phone', cleanPhone)
  if (error) throw error
  return data
}
