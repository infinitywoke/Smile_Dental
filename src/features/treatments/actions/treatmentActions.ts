'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { TreatmentStatus, TreatmentPlanStatus } from '../services/treatmentService'

export async function createTreatmentPlan(patientId: string, name: string, notes?: string) {
  const supabase = await createClient()

  // Verify tenant ownership via patient
  const { data: patient, error: pError } = await supabase
    .from('patients')
    .select('tenant_id')
    .eq('id', patientId)
    .single()

  if (pError || !patient) return { error: 'Patient not found' }

  const { data, error } = await supabase
    .from('treatment_plans')
    .insert({
      tenant_id: patient.tenant_id,
      patient_id: patientId,
      name,
      notes,
      status: 'ACTIVE'
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { data }
}

export async function updateTreatmentPlanStatus(planId: string, status: TreatmentPlanStatus, patientId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('treatment_plans')
    .update({ status })
    .eq('id', planId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function createTreatmentItem(
  planId: string, 
  patientId: string, 
  procedure: string, 
  toothNumber?: string, 
  estimatedCost?: number, 
  notes?: string
) {
  const supabase = await createClient()

  // Note: tenant_id is enforced by RLS, we just need to insert
  const { data, error } = await supabase
    .from('treatment_items')
    .insert({
      treatment_plan_id: planId,
      procedure,
      tooth_number: toothNumber || null,
      estimated_cost: estimatedCost || null,
      notes: notes || null,
      status: 'PLANNED'
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { data }
}

export async function updateTreatmentItemStatus(
  itemId: string, 
  planId: string,
  patientId: string, 
  status: TreatmentStatus
) {
  const supabase = await createClient()

  // If changing to COMPLETED, record the time
  const completedAt = status === 'COMPLETED' ? new Date().toISOString() : null

  const { error } = await supabase
    .from('treatment_items')
    .update({ status, completed_at: completedAt })
    .eq('id', itemId)
    .eq('treatment_plan_id', planId) // Security boundary

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function deleteTreatmentItem(itemId: string, planId: string, patientId: string) {
  const supabase = await createClient()

  // RLS will block if status = 'COMPLETED'
  const { error } = await supabase
    .from('treatment_items')
    .delete()
    .eq('id', itemId)
    .eq('treatment_plan_id', planId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
