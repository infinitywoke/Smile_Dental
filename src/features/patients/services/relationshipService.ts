import { createClient } from '@/utils/supabase/server'

export async function getPatientRelationships(patientId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('patient_relationships')
    .select(`
      id,
      relationship_type,
      related_patient_id,
      patients!patient_relationships_related_patient_id_fkey (
        id,
        name,
        phone,
        date_of_birth
      )
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Failed to fetch patient relationships:", error)
    return []
  }

  // also fetch reverse relationships
  const { data: reverseData, error: reverseError } = await supabase
    .from('patient_relationships')
    .select(`
      id,
      relationship_type,
      patient_id,
      patients!patient_relationships_patient_id_fkey (
        id,
        name,
        phone,
        date_of_birth
      )
    `)
    .eq('related_patient_id', patientId)
    .order('created_at', { ascending: false })

  const forward = (data || []).map(r => ({
    id: r.id,
    relationship_type: r.relationship_type,
    related_patient: r.patients
  }))

  const getReverseType = (type: string) => {
    switch (type) {
      case 'PARENT': return 'CHILD'
      case 'CHILD': return 'PARENT'
      case 'SPOUSE': return 'SPOUSE'
      case 'SIBLING': return 'SIBLING'
      case 'GUARDIAN': return 'DEPENDENT'
      default: return 'OTHER'
    }
  }

  const backward = (reverseData || []).map(r => ({
    id: r.id,
    relationship_type: getReverseType(r.relationship_type),
    related_patient: r.patients
  }))

  return [...forward, ...backward]
}

export async function searchPatientsForRelationship(query: string, excludePatientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, phone, date_of_birth')
    .neq('id', excludePatientId)
    .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(10)

  if (error) {
    console.error("Failed to search patients:", error)
    return []
  }

  return data
}
