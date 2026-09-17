'use server'

import { createClient } from '@/utils/supabase/server'
import { searchPatientsForRelationship } from '../services/relationshipService'
import { revalidatePath } from 'next/cache'

export async function searchPatientsAction(query: string, excludePatientId: string) {
  return searchPatientsForRelationship(query, excludePatientId)
}

export async function addPatientRelationship(patientId: string, relatedPatientId: string, type: string) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Not authenticated' }
  
  const { data: userRow } = await supabase.from('users').select('tenant_id').eq('id', userData.user.id).single()
  const tenant_id = userRow?.tenant_id
  if (!tenant_id) return { error: 'Tenant not found' }

  // Check if it already exists
  const { data: existing } = await supabase
    .from('patient_relationships')
    .select('id')
    .eq('patient_id', patientId)
    .eq('related_patient_id', relatedPatientId)
    .single()

  if (existing) return { error: 'Relationship already exists' }

  const { data: existingReverse } = await supabase
    .from('patient_relationships')
    .select('id')
    .eq('patient_id', relatedPatientId)
    .eq('related_patient_id', patientId)
    .single()

  if (existingReverse) return { error: 'Relationship already exists' }

  const { error } = await supabase
    .from('patient_relationships')
    .insert({
      tenant_id,
      patient_id: patientId,
      related_patient_id: relatedPatientId,
      relationship_type: type
    })

  if (error) {
    console.error("Add relationship error:", error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}

export async function deletePatientRelationship(relationshipId: string, patientId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('patient_relationships')
    .delete()
    .eq('id', relationshipId)

  if (error) return { error: error.message }
  
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { success: true }
}
