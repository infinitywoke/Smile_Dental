import { createClient } from '@/utils/supabase/server'
import { ClinicAction, ActionPriority } from '@/lib/types/actions'

const priorityWeight: Record<ActionPriority, number> = {
  NOW: 1,
  URGENT: 2,
  HIGH: 3,
  NORMAL: 4,
  LOW: 5
}

/**
 * Deterministic rules engine to generate clinic actions for a given patient.
 * Uses targeted server-side queries.
 */
/**
 * Pure deterministic rules engine to compute clinic actions from pre-fetched state.
 * Exposed for rigorous unit testing.
 */
export function computePatientActions(
  patientId: string,
  patientName: string,
  appointments: any[],
  treatmentPlans: any[],
  hasUpcomingAppointment: boolean,
  payments: any[],
  treatmentItems: any[],
  referrals: any[],
  clinicalRecords: any[],
  lastCompletedDate: string | null
): ClinicAction[] {
  const actions: ClinicAction[] = []

  // 1. IN CHAIR / WAITING (NOW)
  if (appointments) {
    for (const apt of appointments) {
      if (apt.status === 'IN_PROGRESS') {
        actions.push({
          id: `apt_now_${apt.id}`,
          patientId,
          patientName,
          type: 'CONTINUE_ENCOUNTER',
          source: 'APPOINTMENT',
          category: 'CLINICAL',
          priority: 'NOW',
          title: 'In Chair',
          description: 'Consultation is currently in progress.',
          actionUrl: `/dashboard/appointments/${apt.id}/consultation`,
          timestamp: apt.updated_at
        })
      } else if (apt.status === 'CHECKED_IN') {
        actions.push({
          id: `apt_wait_${apt.id}`,
          patientId,
          patientName,
          type: 'START_ENCOUNTER',
          source: 'APPOINTMENT',
          category: 'CLINICAL',
          priority: 'NOW',
          title: 'Waiting Room',
          description: 'Patient is waiting to be seen.',
          actionUrl: `/dashboard/appointments/${apt.id}/consultation`,
          timestamp: apt.updated_at
        })
      }
    }
  }

  // 2. FINANCIAL: OUTSTANDING BALANCE
  let balance = 0
  treatmentItems?.forEach(i => { balance += Number(i.estimated_cost) || 0 })
  payments?.forEach(p => { balance -= Number(p.amount_paid) || 0 })
  
  if (balance > 0) {
    actions.push({
      id: `bal_${patientId}`,
      patientId,
      patientName,
      type: 'COLLECT_PAYMENT',
      source: 'PAYMENT',
      category: 'FINANCIAL',
      priority: 'NORMAL',
      title: 'Outstanding Balance',
      description: `₹${balance.toLocaleString()} remains unpaid.`,
      actionUrl: `/dashboard/patients/${patientId}#payments`,
      timestamp: new Date().toISOString()
    })
  }

  // 3. CLINICAL: COMPLETE NOTES
  if (appointments && clinicalRecords) {
    const notedAptIds = new Set(clinicalRecords.map(n => n.appointment_id))
    for (const apt of appointments) {
      if (apt.status === 'COMPLETED' && !notedAptIds.has(apt.id)) {
        actions.push({
          id: `notes_${apt.id}`,
          patientId,
          patientName,
          type: 'COMPLETE_NOTES',
          source: 'CLINICAL_RECORD',
          category: 'CLINICAL',
          priority: 'HIGH',
          title: 'Missing Clinical Note',
          description: 'A completed appointment lacks required documentation.',
          actionUrl: `/dashboard/appointments/${apt.id}/consultation`,
          timestamp: apt.updated_at
        })
      }
    }
  }

  // 4. COORDINATION: REVIEW REFERRAL
  if (referrals) {
    for (const ref of referrals) {
      actions.push({
        id: `ref_${ref.id}`,
        patientId,
        patientName,
        type: 'REVIEW_REFERRAL',
        source: 'REFERRAL',
        category: 'COORDINATION',
        priority: 'HIGH',
        title: 'Specialist Referral Pending',
        description: `Referral to ${ref.specialist_name || 'specialist'} requires attention.`,
        actionUrl: `/dashboard/patients/${patientId}#referrals`,
        timestamp: ref.created_at
      })
    }
  }

  // 5. SCHEDULING: SCHEDULE FOLLOWUP
  if (treatmentPlans && !hasUpcomingAppointment) {
    for (const plan of treatmentPlans) {
      actions.push({
        id: `plan_${plan.id}`,
        patientId,
        patientName,
        type: 'SCHEDULE_FOLLOWUP',
        source: 'TREATMENT',
        category: 'SCHEDULING',
        priority: 'NORMAL',
        title: 'Schedule Follow-up',
        description: `${plan.name} is active but has no upcoming appointment.`,
        actionUrl: `/dashboard/appointments/new?patientId=${patientId}`,
        timestamp: plan.created_at
      })
    }
  }

  // 6. SCHEDULING: SET RECALL
  if (!hasUpcomingAppointment && (!treatmentPlans || treatmentPlans.length === 0) && lastCompletedDate) {
    // Check if more than 6 months have passed since last completed appt
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    if (new Date(lastCompletedDate) < sixMonthsAgo) {
      actions.push({
        id: `recall_${patientId}`,
        patientId,
        patientName,
        type: 'SET_RECALL',
        source: 'RECALL',
        category: 'SCHEDULING',
        priority: 'LOW',
        title: 'Routine Recall',
        description: 'Patient is due for a routine 6-month checkup.',
        actionUrl: `/dashboard/appointments/new?patientId=${patientId}`,
        timestamp: new Date().toISOString()
      })
    }
  }

  actions.sort((a, b) => {
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[a.priority] - priorityWeight[b.priority]
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return actions
}

/**
 * Data-fetching wrapper around computePatientActions.
 */
export async function getPatientActions(patientId: string): Promise<ClinicAction[]> {
  const supabase = await createClient()

  const [
    patientRes,
    aptsRes,
    plansRes,
    futureAptsRes,
    paymentsRes,
    itemsRes,
    refsRes,
    recentNotesRes,
    lastCompletedApptRes
  ] = await Promise.all([
    supabase.from('patients').select('name').eq('id', patientId).single(),
    supabase.from('appointments').select('id, status, updated_at').eq('patient_id', patientId).in('status', ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED']).order('updated_at', { ascending: false }).limit(5),
    supabase.from('treatment_plans').select('id, name, created_at').eq('patient_id', patientId).eq('status', 'ACTIVE'),
    supabase.from('appointments').select('id').eq('patient_id', patientId).in('status', ['SCHEDULED', 'CONFIRMED']).gt('scheduled_start', new Date().toISOString()),
    supabase.from('payments').select('amount_paid').eq('patient_id', patientId),
    supabase.from('treatment_items').select('estimated_cost').eq('patient_id', patientId).neq('status', 'CANCELLED'),
    supabase.from('specialist_referrals').select('id, status, created_at, specialist_name').eq('patient_id', patientId).in('status', ['PENDING_ADVANCE', 'ADVANCE_PAID']),
    supabase.from('clinical_records').select('appointment_id').eq('patient_id', patientId),
    supabase.from('appointments').select('scheduled_start').eq('patient_id', patientId).eq('status', 'COMPLETED').order('scheduled_start', { ascending: false }).limit(1)
  ])

  let lastCompletedDate = null
  if (lastCompletedApptRes.data && lastCompletedApptRes.data.length > 0) {
    lastCompletedDate = lastCompletedApptRes.data[0].scheduled_start
  }

  return computePatientActions(
    patientId,
    patientRes.data?.name || 'Unknown',
    aptsRes.data || [],
    plansRes.data || [],
    !!futureAptsRes.data && futureAptsRes.data.length > 0,
    paymentsRes.data || [],
    itemsRes.data || [],
    refsRes.data || [],
    recentNotesRes.data || [],
    lastCompletedDate
  )
}

export async function getPatientNextAction(patientId: string): Promise<ClinicAction | null> {
  const actions = await getPatientActions(patientId)
  return actions.length > 0 ? actions[0] : null
}

export async function getClinicWideActions(): Promise<ClinicAction[]> {
  const supabase = await createClient()
  let actions: ClinicAction[] = []

  // 1. Web Booking Requests
  const { data: bookings } = await supabase.from('booking_requests').select('id, name, phone, reason, created_at').eq('status', 'PENDING')
  if (bookings) {
    for (const req of bookings) {
      actions.push({
        id: `web_req_${req.id}`,
        patientId: '', // No patient ID yet
        patientName: req.name,
        type: 'RESPOND_TO_BOOKING',
        source: 'BOOKING',
        category: 'SCHEDULING',
        priority: 'URGENT',
        title: 'New Booking Request',
        description: req.reason || 'Patient requested an appointment online.',
        actionUrl: `/dashboard/requests`,
        timestamp: req.created_at
      })
    }
  }

  // For clinic-wide Unresolved Work, we need to gather all patients who have open loops.
  // Instead of fetching everything, we perform targeted queries for the specific states.
  
  // A. Missing Notes (Completed appts in the last 7 days without a clinical record)
  // Since we don't have a complex join for missing notes, we can fetch recent completed appts and recent notes
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const [recentApts, recentNotes] = await Promise.all([
    supabase.from('appointments').select('id, patient_id, updated_at, patients(name)').eq('status', 'COMPLETED').gt('updated_at', sevenDaysAgo.toISOString()),
    supabase.from('clinical_records').select('appointment_id').gt('created_at', sevenDaysAgo.toISOString())
  ])

  if (recentApts.data && recentNotes.data) {
    const notedAptIds = new Set(recentNotes.data.map(n => n.appointment_id))
    for (const apt of recentApts.data) {
      if (!notedAptIds.has(apt.id)) {
        actions.push({
          id: `notes_${apt.id}`,
          patientId: apt.patient_id,
          patientName: (apt.patients as any)?.name || 'Unknown',
          type: 'COMPLETE_NOTES',
          source: 'CLINICAL_RECORD',
          category: 'CLINICAL',
          priority: 'HIGH',
          title: 'Missing Clinical Note',
          description: 'A recent completed appointment lacks required documentation.',
          actionUrl: `/dashboard/appointments/${apt.id}/consultation`,
          timestamp: apt.updated_at
        })
      }
    }
  }

  // B. Pending Referrals
  const { data: referrals } = await supabase.from('specialist_referrals').select('id, patient_id, status, created_at, specialist_name, patients(name)').in('status', ['PENDING_ADVANCE', 'ADVANCE_PAID'])
  if (referrals) {
    for (const ref of referrals) {
      actions.push({
        id: `ref_${ref.id}`,
        patientId: ref.patient_id,
        patientName: (ref.patients as any)?.name || 'Unknown',
        type: 'REVIEW_REFERRAL',
        source: 'REFERRAL',
        category: 'COORDINATION',
        priority: 'HIGH',
        title: 'Specialist Referral Pending',
        description: `Referral to ${ref.specialist_name || 'specialist'} requires attention.`,
        actionUrl: `/dashboard/patients/${ref.patient_id}#referrals`,
        timestamp: ref.created_at
      })
    }
  }

  // C. Active Treatments without future appointments
  const { data: activePlans } = await supabase.from('treatment_plans').select('id, patient_id, name, created_at, patients(name)').eq('status', 'ACTIVE')
  if (activePlans && activePlans.length > 0) {
    const activePatientIds = activePlans.map(p => p.patient_id)
    const { data: futureApts } = await supabase.from('appointments').select('patient_id').in('patient_id', activePatientIds).in('status', ['SCHEDULED', 'CONFIRMED']).gt('scheduled_start', new Date().toISOString())
    
    const hasUpcoming = new Set(futureApts?.map(a => a.patient_id) || [])
    for (const plan of activePlans) {
      if (!hasUpcoming.has(plan.patient_id)) {
        actions.push({
          id: `plan_${plan.id}`,
          patientId: plan.patient_id,
          patientName: (plan.patients as any)?.name || 'Unknown',
          type: 'SCHEDULE_FOLLOWUP',
          source: 'TREATMENT',
          category: 'SCHEDULING',
          priority: 'NORMAL',
          title: 'Schedule Follow-up',
          description: `${plan.name} is active but has no upcoming appointment.`,
          actionUrl: `/dashboard/appointments/new?patientId=${plan.patient_id}`,
          timestamp: plan.created_at
        })
      }
    }
  }

  // D. Outstanding Balances
  const [allPayments, allItems, patientsRes] = await Promise.all([
    supabase.from('payments').select('patient_id, amount_paid'),
    supabase.from('treatment_items').select('patient_id, estimated_cost').neq('status', 'CANCELLED'),
    supabase.from('patients').select('id, name')
  ])

  const balances: Record<string, number> = {}
  allItems.data?.forEach(i => {
    if (i.patient_id && i.estimated_cost) {
      balances[i.patient_id] = (balances[i.patient_id] || 0) + Number(i.estimated_cost)
    }
  })
  allPayments.data?.forEach(p => {
    if (p.patient_id && p.amount_paid) {
      balances[p.patient_id] = (balances[p.patient_id] || 0) - Number(p.amount_paid)
    }
  })

  const patientMap = new Map((patientsRes.data || []).map(p => [p.id, p.name]))

  for (const [patientId, balance] of Object.entries(balances)) {
    if (balance > 0) {
      actions.push({
        id: `bal_${patientId}`,
        patientId,
        patientName: patientMap.get(patientId) || 'Unknown',
        type: 'COLLECT_PAYMENT',
        source: 'PAYMENT',
        category: 'FINANCIAL',
        priority: 'NORMAL',
        title: 'Outstanding Balance',
        description: `₹${balance.toLocaleString()} remains unpaid.`,
        actionUrl: `/dashboard/patients/${patientId}#payments`,
        timestamp: new Date().toISOString()
      })
    }
  }

  actions.sort((a, b) => {
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[a.priority] - priorityWeight[b.priority]
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return actions
}

export async function getTodayActions(): Promise<ClinicAction[]> {
  // Excludes NOW priority actions (handled by the Cockpit) and returns only unresolved work
  const actions = await getClinicWideActions()
  return actions.filter(a => a.priority !== 'NOW')
}
