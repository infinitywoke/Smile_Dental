'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function confirmPatientMatch(recordId: string, patientId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('legacy_records').update({
    patient_id: patientId,
    match_status: 'CONFIRMED'
  }).eq('id', recordId)

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/migration')
  return { success: true }
}

export async function rejectRecord(recordId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('legacy_records').update({
    patient_id: null,
    match_status: 'REJECTED'
  }).eq('id', recordId)

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/migration')
  return { success: true }
}

export async function keepUnmatched(recordId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.from('legacy_records').update({
    patient_id: null,
    match_status: 'UNMATCHED'
  }).eq('id', recordId)

  if (error) return { error: error.message }
  
  revalidatePath('/dashboard/migration')
  return { success: true }
}
