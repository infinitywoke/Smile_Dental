import { createClient } from '@/utils/supabase/server'
import { PatientProfile } from '@/lib/types/database.types'

export async function getPatients(query?: string) {
  const supabase = await createClient()
  let dbQuery = supabase
    .from('patients')
    .select(`
      id,
      name,
      phone,
      date_of_birth,
      created_at,
      appointments (id, scheduled_start, status)
    `)
    .order('created_at', { ascending: false })

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
  }

  const { data, error } = await dbQuery.limit(50)

  if (error) {
    console.error("Failed to fetch patients:", error)
    throw new Error("Failed to fetch patients")
  }

  return data as PatientProfile[]
}

export async function getPatientProfile(id: string): Promise<PatientProfile | null> {
  const supabase = await createClient()

  // Fetch patient base info
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (patientError || !patient) return null

  // Fetch related data in parallel
  const [appointmentsRes, clinicalRes, treatmentRes, paymentRes, legacyRes] = await Promise.all([
    supabase.from('appointments').select('*').eq('patient_id', id).order('scheduled_start', { ascending: false }),
    supabase.from('clinical_records').select(`
      *,
      clinical_record_teeth (*)
    `).eq('patient_id', id).order('created_at', { ascending: false }),
    supabase.from('treatment_plans').select(`
      *,
      treatment_items (*)
    `).eq('patient_id', id).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('patient_id', id).order('payment_date', { ascending: false }),
    supabase.from('legacy_records').select('*').eq('patient_id', id).order('transaction_date', { ascending: false })
  ])

  return {
    ...patient,
    appointments: appointmentsRes.data || [],
    clinical_records: clinicalRes.data || [],
    treatment_plans: treatmentRes.data || [],
    payments: paymentRes.data || [],
    legacy_records: legacyRes.data || [],
  } as PatientProfile
}
