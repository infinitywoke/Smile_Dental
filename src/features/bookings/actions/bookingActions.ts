'use server'

import { revalidatePath } from 'next/cache'
import { 
  submitPublicBookingRequest, 
  updateBookingRequestStatus,
  BookingSource,
  BookingRequestStatus
} from '../services/bookingService'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function submitBookingForm(formData: FormData) {
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const dob = formData.get('dob') as string
  const location = formData.get('location') as string
  const city = formData.get('city') as string
  const preferred_date = formData.get('preferred_date') as string
  const preferred_time = formData.get('preferred_time') as string
  const reason = formData.get('reason') as string
  const notes = formData.get('notes') as string
  const source = (formData.get('source') as BookingSource) || 'WEBSITE'

  if (!name || !phone || !preferred_date || !reason) {
    return { error: 'Missing required fields' }
  }

  try {
    const admin = createAdminClient()
    
    // Check rate limit (1 request per hour per phone)
    const { data: recent } = await admin.from('booking_requests')
      .select('id')
      .eq('phone', phone.trim())
      .gt('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    
    if (recent && recent.length > 0) {
      return { success: true }
    }

    await submitPublicBookingRequest({
      name,
      phone,
      dob,
      location,
      city,
      preferred_date,
      preferred_time,
      reason,
      notes,
      source
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('Failed to submit booking:', error)
    return { error: 'Failed to submit request. Please try again later.' }
  }
}

export async function changeRequestStatus(id: string, status: BookingRequestStatus) {
  try {
    await updateBookingRequestStatus(id, status)
    revalidatePath('/dashboard/requests')
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function checkPatientMatch(phone: string) {
  try {
    const { findPotentialPatientMatch } = await import('../services/bookingService')
    const matches = await findPotentialPatientMatch(phone)
    return { matches }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function convertToPatient(requestId: string, patientId?: string | null) {
  const supabase = await createServerClient()
  
  const { data: request, error: reqError } = await supabase.from('booking_requests').select('*').eq('id', requestId).single()
  if (reqError || !request) return { error: 'Booking request not found' }

  // Call the atomic RPC
  const { data: finalPatientId, error: rpcError } = await supabase.rpc('convert_booking_request_to_patient', {
    p_request_id: requestId,
    p_existing_patient_id: patientId || null
  })

  if (rpcError) {
    return { error: rpcError.message }
  }

  revalidatePath('/dashboard/requests')
  
  return { success: true, patientId: finalPatientId, source: request.source }
}
