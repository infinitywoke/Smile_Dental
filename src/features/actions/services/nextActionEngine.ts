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
 * Pure deterministic rules engine to compute clinic actions from pre-fetched state.
 * Exposed for rigorous unit testing.
 */
export function computePatientActions(
  patientId: string,
  patientName: string,
  appointments: any[],
  treatmentPlans: any[],
  hasUpcomingAppointment: boolean,
  balance: number,
  referrals: any[],
  clinicalRecords: any[],
  lastCompletedDate: string | null
): ClinicAction[] {
  const actions: ClinicAction[] = []

  // 1. IN CHAIR / WAITING (NOW)
  if (appointments) {
    for (const apt of appointments) {
      let isPast = false
      if (apt.scheduled_start) {
        const aptDate = new Date(apt.scheduled_start)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        isPast = aptDate < todayStart
      }

      if (apt.status === 'IN_PROGRESS' && !isPast) {
        // Calculate elapsed time if available
        let elapsedStr = ''
        if (apt.updated_at) {
          const diffMins = Math.floor((Date.now() - new Date(apt.updated_at).getTime()) / 60000)
          elapsedStr = diffMins > 0 ? ` (${diffMins}m elapsed)` : ''
        }
        
        actions.push({
          id: `apt_now_${apt.id}`,
          patientId,
          patientName,
          type: 'CONTINUE_ENCOUNTER',
          source: 'APPOINTMENT',
          category: 'CLINICAL',
          priority: 'NOW',
          title: 'In Chair',
          description: apt.reason ? `Consultation for ${apt.reason} in progress${elapsedStr}.` : `Consultation is currently in progress${elapsedStr}.`,
          actionUrl: `/dashboard/appointments/${apt.id}/consultation?action=continue_encounter`,
          timestamp: apt.updated_at,
          appointmentId: apt.id,
          reason: apt.reason,
          scheduledAt: apt.scheduled_start
        })
      } else if (apt.status === 'CHECKED_IN') {
        const timeStr = apt.scheduled_start ? new Date(apt.scheduled_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''
        actions.push({
          id: `apt_wait_${apt.id}`,
          patientId,
          patientName,
          type: 'START_ENCOUNTER',
          source: 'APPOINTMENT',
          category: 'CLINICAL',
          priority: 'NOW',
          title: 'Waiting Room',
          description: apt.reason ? `Waiting for today's appointment (${apt.reason}) at ${timeStr}.` : `Patient is waiting to be seen.`,
          actionUrl: `/dashboard/appointments/${apt.id}/consultation?action=start_encounter`,
          timestamp: apt.updated_at,
          appointmentId: apt.id,
          reason: apt.reason,
          scheduledAt: apt.scheduled_start
        })
      }
    }
  }

  // 2. FINANCIAL: OUTSTANDING BALANCE
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
      description: `₹${balance.toLocaleString()} remains unpaid on account.`,
      actionUrl: `/dashboard/patients/${patientId}#payments`,
      timestamp: new Date().toISOString(),
      amount: balance
    })
  }

  // 3. CLINICAL: COMPLETE NOTES
  if (appointments && clinicalRecords) {
    const notedAptIds = new Set(clinicalRecords.map((n: any) => n.appointment_id))
    for (const apt of appointments) {
      let isPast = false
      if (apt.scheduled_start) {
        const aptDate = new Date(apt.scheduled_start)
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)
        isPast = aptDate < todayStart
      }

      if (apt.status === 'IN_PROGRESS' && isPast && !notedAptIds.has(apt.id)) {
        const dateStr = apt.scheduled_start ? new Date(apt.scheduled_start).toLocaleDateString() : 'recent'
        actions.push({
          id: `notes_${apt.id}`,
          patientId,
          patientName,
          type: 'COMPLETE_NOTES',
          source: 'CLINICAL_RECORD',
          category: 'CLINICAL',
          priority: 'HIGH',
          title: 'Missing Clinical Note',
          description: apt.reason ? `Requires documentation for past visit (${apt.reason}).` : `Past appointment on ${dateStr} lacks required documentation.`,
          actionUrl: `/dashboard/appointments/${apt.id}/consultation?action=complete_notes`,
          timestamp: apt.updated_at,
          appointmentId: apt.id,
          reason: apt.reason,
          scheduledAt: apt.scheduled_start
        })
      }
    }
  }

  // 4. COORDINATION: REVIEW REFERRAL
  if (referrals) {
    for (const ref of referrals) {
      if (ref.status === 'PENDING_ADVANCE' || ref.status === 'ADVANCE_PAID') {
        const refStatus = ref.status === 'PENDING_ADVANCE' ? 'Pending Advance' : 'Advance Paid'
        actions.push({
          id: `ref_${ref.id}`,
          patientId,
          patientName,
          type: 'REVIEW_REFERRAL',
          source: 'REFERRAL',
          category: 'COORDINATION',
          priority: 'HIGH',
          title: 'Specialist Referral Pending',
          description: ref.reason 
            ? `Referral to ${ref.specialist_name || 'specialist'} for ${ref.reason} (${refStatus}).` 
            : `Referral to ${ref.specialist_name || 'specialist'} requires attention (${refStatus}).`,
          actionUrl: `/dashboard/patients/${patientId}#referrals`,
          timestamp: ref.created_at,
          referralId: ref.id,
          specialistName: ref.specialist_name,
          reason: ref.reason
        })
      }
    }
  }

  // 5. SCHEDULING: SCHEDULE FOLLOW-UP
  if (treatmentPlans) {
    const activePlans = treatmentPlans.filter(p => p.status === 'ACTIVE')
    if (activePlans.length > 0 && !hasUpcomingAppointment) {
      // Create ONE follow-up action even if multiple plans exist, to avoid duplication noise.
      // Prioritize the plan that was most recently created or has the most pressing pending item.
      const plan = activePlans[0] 
      
      let nextItem = null
      if (plan.treatment_items) {
        nextItem = plan.treatment_items.find((i: any) => i.status === 'PLANNED')
      }

      let desc = `${plan.name} is active but has no upcoming appointment.`
      if (nextItem) {
        const toothStr = nextItem.tooth_number ? ` · Tooth #${nextItem.tooth_number}` : ''
        desc = `Schedule ${plan.name} follow-up${toothStr} · Next: ${nextItem.procedure}`
      }

      actions.push({
        id: `plan_${plan.id}`,
        patientId,
        patientName,
        type: 'SCHEDULE_FOLLOWUP',
        source: 'TREATMENT',
        category: 'SCHEDULING',
        priority: 'NORMAL',
        title: 'Schedule Follow-up',
        description: desc,
        actionUrl: `/dashboard/appointments/new?patientId=${patientId}&action=schedule_followup&planId=${plan.id}`,
        timestamp: plan.created_at,
        treatmentPlanId: plan.id,
        treatmentItemId: nextItem?.id,
        tooth: nextItem?.tooth_number,
        reason: nextItem?.procedure || plan.name
      })
    }
  }

  // 6. CLINICAL: COMPLETE TREATMENT (IN_PROGRESS items)
  if (treatmentPlans) {
    const activePlans = treatmentPlans.filter((p: any) => p.status === 'ACTIVE')
    for (const plan of activePlans) {
      if (plan.treatment_items) {
        const inProgressItems = plan.treatment_items.filter((i: any) => i.status === 'IN_PROGRESS')
        for (const item of inProgressItems) {
          const toothStr = item.tooth_number ? " (Tooth #" + item.tooth_number + ")" : ""
          actions.push({
            id: "treat_" + item.id,
            patientId,
            patientName,
            type: 'COMPLETE_TREATMENT',
            source: 'TREATMENT',
            category: 'CLINICAL',
            priority: 'HIGH',
            title: 'Complete Treatment',
            description: item.procedure + toothStr + " is currently in progress.",
            actionUrl: "/dashboard/patients/" + patientId + "#treatments",
            timestamp: plan.created_at || new Date().toISOString(),
            treatmentPlanId: plan.id,
            treatmentItemId: item.id,
            tooth: item.tooth_number,
            reason: item.procedure
          })
        }
      }
    }
  }

  // 7. SCHEDULING: SET RECALL (Routine Checkup)
  // Only trigger if no active plans, no future appointments, and > 6 months since last completed
  if (!hasUpcomingAppointment && (!treatmentPlans || treatmentPlans.filter(p => p.status === 'ACTIVE').length === 0)) {
    if (lastCompletedDate) {
      const lastDate = new Date(lastCompletedDate)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      if (lastDate < sixMonthsAgo) {
        const diffMonths = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        actions.push({
          id: `recall_${patientId}`,
          patientId,
          patientName,
          type: 'SET_RECALL',
          source: 'RECALL',
          category: 'SCHEDULING',
          priority: 'LOW',
          title: 'Routine Recall',
          description: `Routine recall · Last visit ${diffMonths} months ago.`,
          actionUrl: `/dashboard/appointments/new?patientId=${patientId}&action=set_recall`,
          timestamp: lastCompletedDate,
          scheduledAt: lastCompletedDate
        })
      }
    }
  }

  // Sort logically for Patient Command Centre (prioritizes High urgency + older items)
  actions.sort((a, b) => {
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[a.priority] - priorityWeight[b.priority]
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
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
    balanceRes,
    refsRes,
    recentNotesRes,
    lastCompletedApptRes
  ] = await Promise.all([
    supabase.from('patients').select('name').eq('id', patientId).single(),
    supabase.from('appointments').select('id, status, updated_at, reason, scheduled_start').eq('patient_id', patientId).in('status', ['CHECKED_IN', 'IN_PROGRESS', 'COMPLETED']).order('updated_at', { ascending: false }).limit(5),
    supabase.from('treatment_plans').select(`
      id, name, created_at, status,
      treatment_items (
        id, procedure, tooth_number, status, estimated_cost
      )
    `).eq('patient_id', patientId),
    supabase.from('appointments').select('id').eq('patient_id', patientId).in('status', ['SCHEDULED', 'CONFIRMED']).gt('scheduled_start', new Date().toISOString()),
    supabase.from('patient_financial_balances').select('balance').eq('patient_id', patientId).single(),
    supabase.from('specialist_referrals').select('id, status, created_at, specialist_name, reason').eq('patient_id', patientId).in('status', ['PENDING_ADVANCE', 'ADVANCE_PAID']),
    supabase.from('clinical_records').select('appointment_id').eq('patient_id', patientId),
    supabase.from('appointments').select('scheduled_start').eq('patient_id', patientId).eq('status', 'COMPLETED').order('scheduled_start', { ascending: false }).limit(1)
  ])

  let lastCompletedDate = null
  if (lastCompletedApptRes.data && lastCompletedApptRes.data.length > 0) {
    lastCompletedDate = lastCompletedApptRes.data[0].scheduled_start
  }
  
  const balance = balanceRes.data?.balance || 0

  return computePatientActions(
    patientId,
    patientRes.data?.name || 'Unknown',
    aptsRes.data || [],
    plansRes.data || [],
    !!futureAptsRes.data && futureAptsRes.data.length > 0,
    balance,
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
  const { data: bookings } = await supabase.from('booking_requests').select('id, name, phone, reason, created_at').eq('status', 'NEW')
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
        description: req.reason ? `Reason: ${req.reason}` : 'Patient requested an appointment online.',
        actionUrl: `/dashboard/requests`,
        timestamp: req.created_at,
        bookingRequestId: req.id,
        reason: req.reason
      })
    }
  }

  // A. Missing Notes (IN_PROGRESS appts from past days without clinical records)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const [aptsRes, notesRes] = await Promise.all([
    supabase.from('appointments').select('id, patient_id, updated_at, reason, scheduled_start, patients(name)')
      .eq('status', 'IN_PROGRESS')
      .lt('scheduled_start', todayStart.toISOString()),
    supabase.from('clinical_records').select('appointment_id')
  ])

  if (aptsRes.data && notesRes.data) {
    const notedAptIds = new Set(notesRes.data.map(n => n.appointment_id))
    for (const apt of aptsRes.data) {
      if (!notedAptIds.has(apt.id)) {
        const dateStr = apt.scheduled_start ? new Date(apt.scheduled_start).toLocaleDateString() : 'recent'
        actions.push({
          id: `notes_${apt.id}`,
          patientId: apt.patient_id,
          patientName: (apt.patients as any)?.name || 'Unknown',
          type: 'COMPLETE_NOTES',
          source: 'CLINICAL_RECORD',
          category: 'CLINICAL',
          priority: 'HIGH',
          title: 'Missing Clinical Note',
          description: apt.reason ? `Requires documentation for past visit (${apt.reason}).` : `Past appointment on ${dateStr} lacks required documentation.`,
          actionUrl: `/dashboard/appointments/${apt.id}/consultation?action=complete_notes`,
          timestamp: apt.updated_at,
          appointmentId: apt.id,
          reason: apt.reason,
          scheduledAt: apt.scheduled_start
        })
      }
    }
  }

  // B. Pending Referrals
  const { data: referrals } = await supabase.from('specialist_referrals').select('id, patient_id, status, created_at, specialist_name, reason, patients(name)').in('status', ['PENDING_ADVANCE', 'ADVANCE_PAID'])
  if (referrals) {
    for (const ref of referrals) {
      const refStatus = ref.status === 'PENDING_ADVANCE' ? 'Pending Advance' : 'Advance Paid'
      actions.push({
        id: `ref_${ref.id}`,
        patientId: ref.patient_id,
        patientName: (ref.patients as any)?.name || 'Unknown',
        type: 'REVIEW_REFERRAL',
        source: 'REFERRAL',
        category: 'COORDINATION',
        priority: 'HIGH',
        title: 'Specialist Referral Pending',
        description: ref.reason 
            ? `Referral to ${ref.specialist_name || 'specialist'} for ${ref.reason} (${refStatus}).` 
            : `Referral to ${ref.specialist_name || 'specialist'} requires attention (${refStatus}).`,
        actionUrl: `/dashboard/patients/${ref.patient_id}#referrals`,
        timestamp: ref.created_at,
        referralId: ref.id,
        specialistName: ref.specialist_name,
        reason: ref.reason
      })
    }
  }

  // C. Active Treatments without future appointments
  const { data: activePlans } = await supabase.from('treatment_plans').select(`
    id, patient_id, name, created_at, 
    patients(name),
    treatment_items(id, procedure, tooth_number, status)
  `).eq('status', 'ACTIVE')
  
  if (activePlans && activePlans.length > 0) {
    const activePatientIds = activePlans.map(p => p.patient_id)
    const { data: futureApts } = await supabase.from('appointments').select('patient_id').in('patient_id', activePatientIds).in('status', ['SCHEDULED', 'CONFIRMED']).gt('scheduled_start', new Date().toISOString())
    
    const hasUpcoming = new Set(futureApts?.map(a => a.patient_id) || [])
    
    // Deduplicate so a single patient only gets ONE follow-up action even if they have 3 active plans
    const handledPatients = new Set<string>()

    for (const plan of activePlans) {
      if (plan.treatment_items) {
        const inProgressItems = (plan.treatment_items as any[]).filter((i: any) => i.status === 'IN_PROGRESS')
        for (const item of inProgressItems) {
          const toothStr = item.tooth_number ? " (Tooth #" + item.tooth_number + ")" : ""
          actions.push({
            id: "treat_" + item.id,
            patientId: plan.patient_id,
            patientName: (plan.patients as any)?.name || 'Unknown',
            type: 'COMPLETE_TREATMENT',
            source: 'TREATMENT',
            category: 'CLINICAL',
            priority: 'HIGH',
            title: 'Complete Treatment',
            description: item.procedure + toothStr + " is currently in progress.",
            actionUrl: "/dashboard/patients/" + plan.patient_id + "#treatments",
            timestamp: plan.created_at,
            treatmentPlanId: plan.id,
            treatmentItemId: item.id,
            tooth: item.tooth_number,
            reason: item.procedure
          })
        }
      }

      if (!hasUpcoming.has(plan.patient_id) && !handledPatients.has(plan.patient_id)) {
        handledPatients.add(plan.patient_id)
        
        let nextItem = null
        if (plan.treatment_items) {
          nextItem = (plan.treatment_items as any[]).find((i: any) => i.status === 'PLANNED')
        }

        let desc = `${plan.name} is active but has no upcoming appointment.`
        if (nextItem) {
          const toothStr = nextItem.tooth_number ? ` · Tooth #${nextItem.tooth_number}` : ''
          desc = `Schedule ${plan.name} follow-up${toothStr} · Next: ${nextItem.procedure}`
        }

        actions.push({
          id: `plan_${plan.id}`,
          patientId: plan.patient_id,
          patientName: (plan.patients as any)?.name || 'Unknown',
          type: 'SCHEDULE_FOLLOWUP',
          source: 'TREATMENT',
          category: 'SCHEDULING',
          priority: 'NORMAL',
          title: 'Schedule Follow-up',
          description: desc,
          actionUrl: `/dashboard/appointments/new?patientId=${plan.patient_id}&action=schedule_followup&planId=${plan.id}`,
          timestamp: plan.created_at,
          treatmentPlanId: plan.id,
          treatmentItemId: nextItem?.id,
          tooth: nextItem?.tooth_number,
          reason: nextItem?.procedure || plan.name
        })
      }
    }
  }

  // D. Outstanding Balances (Uses Phase 5.1 DB View)
  const { data: balanceData } = await supabase
    .from('patient_financial_balances')
    .select('patient_id, patient_name, balance')
    .gt('balance', 0)

  if (balanceData) {
    for (const b of balanceData) {
      actions.push({
        id: `bal_${b.patient_id}`,
        patientId: b.patient_id,
        patientName: b.patient_name || 'Unknown',
        type: 'COLLECT_PAYMENT',
        source: 'PAYMENT',
        category: 'FINANCIAL',
        priority: 'NORMAL',
        title: 'Outstanding Balance',
        description: `₹${b.balance.toLocaleString()} remains unpaid on account.`,
        actionUrl: `/dashboard/patients/${b.patient_id}#payments`,
        timestamp: new Date().toISOString(),
        amount: b.balance
      })
    }
  }

  // Sort globally by priority then timestamp
  actions.sort((a, b) => {
    if (priorityWeight[a.priority] !== priorityWeight[b.priority]) {
      return priorityWeight[a.priority] - priorityWeight[b.priority]
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() // Older items first within same priority
  })

  return actions
}

export async function getTodayActions(): Promise<ClinicAction[]> {
  // Excludes NOW priority actions (handled by the Cockpit) and returns only unresolved work
  const actions = await getClinicWideActions()
  return actions.filter(a => a.priority !== 'NOW')
}
