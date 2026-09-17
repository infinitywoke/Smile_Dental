'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { PaymentMethod } from '../services/paymentService'

export async function recordPayment(
  patientId: string,
  amount: number,
  paymentDate: string, // YYYY-MM-DD
  paymentMode: PaymentMethod,
  treatmentPlanId?: string | null,
  treatmentItemId?: string | null,
  reference?: string | null,
  specialistReferralId?: string | null
) {
  const supabase = await createClient()

  if (amount <= 0) {
    return { error: 'Payment amount must be greater than zero.' }
  }

  // Verify patient exists and get tenant
  const { data: patient, error: pError } = await supabase
    .from('patients')
    .select('tenant_id')
    .eq('id', patientId)
    .single()

  if (pError || !patient) return { error: 'Patient not found' }

  // Security bounds checks
  if (treatmentPlanId) {
    const { data: plan } = await supabase.from('treatment_plans').select('patient_id').eq('id', treatmentPlanId).single()
    if (!plan || plan.patient_id !== patientId) return { error: 'Invalid treatment plan for this patient.' }
  }

  if (treatmentItemId) {
    const { data: item } = await supabase.from('treatment_items').select('treatment_plan_id').eq('id', treatmentItemId).single()
    if (!item) return { error: 'Invalid treatment item.' }
    if (treatmentPlanId && item.treatment_plan_id !== treatmentPlanId) {
      return { error: 'Treatment item does not belong to the selected plan.' }
    }
    if (!treatmentPlanId) treatmentPlanId = item.treatment_plan_id
  }

  if (specialistReferralId) {
    const { data: ref } = await supabase.from('specialist_referrals')
      .select('patient_id, tenant_id, advance_required, status')
      .eq('id', specialistReferralId).single()
    
    if (!ref) return { error: 'Specialist referral not found.' }
    if (ref.patient_id !== patientId) return { error: 'Payment patient mismatch for specialist referral.' }
    if (ref.tenant_id !== patient.tenant_id) return { error: 'Tenant mismatch for specialist referral.' }
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      tenant_id: patient.tenant_id,
      patient_id: patientId,
      amount,
      payment_date: paymentDate,
      payment_mode: paymentMode,
      treatment_plan_id: treatmentPlanId || null,
      treatment_item_id: treatmentItemId || null,
      reference: reference || null,
      specialist_referral_id: specialistReferralId || null
    })
    .select('id')
    .single()

  if (error) {
    console.error("Payment insert error:", error)
    return { error: error.message }
  }

  // Update specialist referral if attached and threshold met
  if (specialistReferralId) {
    // Calculate total paid so far
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('specialist_referral_id', specialistReferralId)
      
    const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0)
    
    const { data: ref } = await supabase.from('specialist_referrals')
      .select('advance_required, status')
      .eq('id', specialistReferralId).single()

    if (ref && ref.status === 'PENDING_ADVANCE' && totalPaid >= Number(ref.advance_required)) {
      await supabase.from('specialist_referrals')
        .update({ status: 'ADVANCE_PAID' })
        .eq('id', specialistReferralId)
    }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { data, success: true }
}
