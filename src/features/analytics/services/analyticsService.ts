import { createClient } from '@/utils/supabase/server'

export type DateRange = {
  start: Date
  end: Date
}

export async function getAnalyticsOverview(range: DateRange) {
  const supabase = await createClient()

  // New Patients
  const { count: newPatients } = await supabase
    .from('patients')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', range.start.toISOString())
    .lte('created_at', range.end.toISOString())

  // Booking Requests
  const { data: requests } = await supabase
    .from('booking_requests')
    .select('status')
    .gte('created_at', range.start.toISOString())
    .lte('created_at', range.end.toISOString())

  const totalRequests = requests?.length || 0
  const convertedRequests = requests?.filter(r => r.status === 'CONVERTED').length || 0
  const conversionRate = totalRequests > 0 ? (convertedRequests / totalRequests) * 100 : 0

  // Appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('status')
    .gte('scheduled_start', range.start.toISOString())
    .lte('scheduled_start', range.end.toISOString())

  const totalAppointments = appointments?.length || 0
  const completedAppointments = appointments?.filter(a => a.status === 'COMPLETED').length || 0
  const noShowAppointments = appointments?.filter(a => a.status === 'NO_SHOW').length || 0
  const noShowRate = totalAppointments > 0 ? (noShowAppointments / totalAppointments) * 100 : 0

  // Payments
  const { data: payments } = await supabase
    .from('payments')
    .select('amount')
    .gte('payment_date', range.start.toISOString())
    .lte('payment_date', range.end.toISOString())

  const totalCollected = payments?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0

  return {
    newPatients: newPatients || 0,
    completedVisits: completedAppointments,
    bookingRequests: totalRequests,
    conversionRate,
    modernPaymentsCollected: totalCollected,
    noShowRate
  }
}

export async function getAcquisitionMetrics(range: DateRange) {
  const supabase = await createClient()

  const { data: requests } = await supabase
    .from('booking_requests')
    .select('status, source')
    .gte('created_at', range.start.toISOString())
    .lte('created_at', range.end.toISOString())

  if (!requests) return { bySource: {}, funnel: { requests: 0, contacted: 0, converted: 0 } }

  const bySource = requests.reduce((acc: any, r) => {
    const src = r.source || 'UNKNOWN'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})

  const funnel = {
    requests: requests.length,
    contacted: requests.filter(r => ['CONTACTED', 'CONVERTED'].includes(r.status)).length,
    converted: requests.filter(r => r.status === 'CONVERTED').length
  }

  return { bySource, funnel }
}

export async function getAppointmentMetrics(range: DateRange) {
  const supabase = await createClient()

  const { data: appointments } = await supabase
    .from('appointments')
    .select('status, scheduled_start')
    .gte('scheduled_start', range.start.toISOString())
    .lte('scheduled_start', range.end.toISOString())

  if (!appointments) return { total: 0, completed: 0, cancelled: 0, noShow: 0, byDay: {} }

  let completed = 0, cancelled = 0, noShow = 0
  const byDay: Record<string, number> = {}

  appointments.forEach(a => {
    if (a.status === 'COMPLETED') completed++
    if (a.status === 'CANCELLED') cancelled++
    if (a.status === 'NO_SHOW') noShow++

    const day = a.scheduled_start.split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1
  })

  return {
    total: appointments.length,
    completed,
    cancelled,
    noShow,
    byDay
  }
}

export async function getTreatmentMetrics(range: DateRange) {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('treatment_plans')
    .select('id')
    .gte('created_at', range.start.toISOString())
    .lte('created_at', range.end.toISOString())

  const { data: items } = await supabase
    .from('treatment_items')
    .select('status, cost')
    .gte('created_at', range.start.toISOString())
    .lte('created_at', range.end.toISOString())

  let planned = 0, inProgress = 0, completed = 0, totalValue = 0

  if (items) {
    items.forEach(i => {
      if (i.status === 'PLANNED') planned++
      if (i.status === 'IN_PROGRESS') inProgress++
      if (i.status === 'COMPLETED') completed++
      totalValue += Number(i.cost) || 0
    })
  }

  return {
    plansCreated: plans?.length || 0,
    itemsPlanned: planned,
    itemsInProgress: inProgress,
    itemsCompleted: completed,
    estimatedValue: totalValue
  }
}

export async function getFinancialMetrics(range: DateRange) {
  const supabase = await createClient()

  const { data: payments } = await supabase
    .from('payments')
    .select('amount, payment_mode, payment_date')
    .gte('payment_date', range.start.toISOString())
    .lte('payment_date', range.end.toISOString())

  if (!payments || payments.length === 0) {
    return { total: 0, byMode: {}, overTime: {}, count: 0, average: 0 }
  }

  let total = 0
  const byMode: Record<string, number> = {}
  const overTime: Record<string, number> = {}

  payments.forEach(p => {
    const amt = Number(p.amount) || 0
    total += amt
    
    const mode = p.payment_mode || 'UNKNOWN'
    byMode[mode] = (byMode[mode] || 0) + amt

    const day = p.payment_date.split('T')[0]
    overTime[day] = (overTime[day] || 0) + amt
  })

  return {
    total,
    byMode,
    overTime,
    count: payments.length,
    average: total / payments.length
  }
}
