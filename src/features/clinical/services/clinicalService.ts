import { createClient } from '@/utils/supabase/server'
import { Appointment } from '@/features/appointments/types'
import { Patient } from '@/features/patients/types'

export type ClinicalRecord = {
  id: string
  tenant_id: string
  patient_id: string
  appointment_id: string
  chief_complaint?: string
  diagnosis?: string
  procedure_summary?: string
  advice?: string
  medications?: string
  created_by: string
  created_at: string
}

export type ClinicalRecordTooth = {
  id: string
  clinical_record_id: string
  tooth_number: string
  notes?: string
}

export type ToothInput = {
  tooth_number: string
  notes?: string
}

export type ConsultationContext = {
  appointment: Appointment
  patient: Patient
  pastRecords: any[]
  activePlans: any[]
  legacyRecords: any[]
}

export async function getConsultationContext(appointmentId: string): Promise<ConsultationContext> {
  const supabase = await createClient()

  const { data: appointment, error: apptError } = await supabase
    .from('appointments')
    .select('*, patients(*)')
    .eq('id', appointmentId)
    .single()

  if (apptError || !appointment) {
    throw new Error('Appointment not found')
  }

  const patientId = appointment.patient_id

  // Past records
  const { data: pastRecords } = await supabase
    .from('clinical_records')
    .select('*, clinical_record_teeth(*)')
    .eq('patient_id', patientId)
    .neq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Active plans
  const { data: activePlans } = await supabase
    .from('treatment_plans')
    .select('*, treatment_items(*)')
    .eq('patient_id', patientId)
    .eq('status', 'ACTIVE')

  // Legacy records
  const { data: legacyRecords } = await supabase
    .from('legacy_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('transaction_date', { ascending: false })

  return {
    appointment,
    patient: appointment.patients,
    pastRecords: pastRecords || [],
    activePlans: activePlans || [],
    legacyRecords: legacyRecords || []
  }
}

export async function getClinicalRecordForAppointment(appointmentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clinical_records')
    .select('*, clinical_record_teeth(*)')
    .eq('appointment_id', appointmentId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching clinical record:', error)
    return null
  }

  return data
}
