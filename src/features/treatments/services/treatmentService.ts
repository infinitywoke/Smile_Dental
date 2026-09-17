import { createClient } from '@/utils/supabase/server'
import { Database } from '@/lib/types/database.types'

export type TreatmentPlan = Database['public']['Tables']['treatment_plans']['Row']
export type TreatmentItem = Database['public']['Tables']['treatment_items']['Row']
export type TreatmentPlanStatus = Database['public']['Enums']['treatment_plan_status']
export type TreatmentStatus = Database['public']['Enums']['treatment_status']

export type TreatmentPlanWithItems = TreatmentPlan & {
  treatment_items: TreatmentItem[]
}

export async function getPatientTreatmentPlans(patientId: string): Promise<TreatmentPlanWithItems[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treatment_plans')
    .select(`
      *,
      treatment_items (*)
    `)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching treatment plans:', error)
    return []
  }

  // Sort items by created_at inside each plan
  return (data as TreatmentPlanWithItems[]).map(plan => ({
    ...plan,
    treatment_items: plan.treatment_items.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }))
}

export async function getTreatmentPlan(planId: string): Promise<TreatmentPlanWithItems | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('treatment_plans')
    .select(`
      *,
      treatment_items (*)
    `)
    .eq('id', planId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    treatment_items: data.treatment_items.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  } as TreatmentPlanWithItems
}
