import { createClient } from '@/utils/supabase/server'
import { Database } from '@/lib/types/database.types'

export type Payment = Database['public']['Tables']['payments']['Row'] & {
  treatment_items?: { procedure: string, tooth_number: string | null } | null
  treatment_plan_id?: string | null
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'OTHER'

export interface PatientFinancialSummary {
  totalEstimated: number
  totalPaid: number
  totalRemaining: number
}

export async function getPatientPayments(patientId: string): Promise<Payment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select(`
      *,
      treatment_items (
        procedure,
        tooth_number
      )
    `)
    .eq('patient_id', patientId)
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching patient payments:', error)
    return []
  }

  return data as Payment[]
}

export async function getPatientFinancialSummary(patientId: string): Promise<PatientFinancialSummary> {
  const supabase = await createClient()

  // 1. Get all treatment plans and their items to sum total estimated
  const { data: plans } = await supabase
    .from('treatment_plans')
    .select(`
      id,
      treatment_items (
        estimated_cost
      )
    `)
    .eq('patient_id', patientId)
    .neq('status', 'CANCELLED')

  let totalEstimated = 0
  if (plans) {
    for (const plan of plans) {
      if (plan.treatment_items) {
        for (const item of plan.treatment_items) {
          totalEstimated += Number(item.estimated_cost) || 0
        }
      }
    }
  }

  // 2. Get all payments to sum total paid
  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .eq('patient_id', patientId)

  let totalPaid = 0
  if (payments) {
    for (const payment of payments) {
      totalPaid += Number(payment.amount) || 0
    }
  }

  return {
    totalEstimated,
    totalPaid,
    totalRemaining: Math.max(0, totalEstimated - totalPaid)
  }
}
