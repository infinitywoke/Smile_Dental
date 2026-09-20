'use client'

import { format, parseISO } from 'date-fns'
import { Calendar, CreditCard, Stethoscope, FileText, CheckCircle2, Circle } from 'lucide-react'

type TimelineEvent = {
  id: string
  type: 'appointment' | 'clinical_record' | 'payment' | 'treatment_plan'
  date: string
  title: string
  description?: string
  status?: string
}

export function PatientTimeline({
  appointments = [],
  clinicalRecords = [],
  payments = [],
  treatmentPlans = []
}: {
  appointments?: any[]
  clinicalRecords?: any[]
  payments?: any[]
  treatmentPlans?: any[]
}) {
  const events: TimelineEvent[] = []

  appointments.forEach(a => {
    events.push({
      id: `apt-${a.id}`,
      type: 'appointment',
      date: a.scheduled_start,
      title: `Appointment: ${a.reason || 'Consultation'}`,
      status: a.status
    })
  })

  clinicalRecords.forEach(c => {
    events.push({
      id: `cr-${c.id}`,
      type: 'clinical_record',
      date: c.created_at,
      title: `Clinical Notes`,
      description: c.chief_complaint || 'Notes recorded'
    })
  })

  payments.forEach(p => {
    events.push({
      id: `pay-${p.id}`,
      type: 'payment',
      date: p.payment_date,
      title: `Payment: ₹${p.amount_paid}`,
      description: `Method: ${p.payment_method}`
    })
  })

  treatmentPlans.forEach(tp => {
    events.push({
      id: `tp-${tp.id}`,
      type: 'treatment_plan',
      date: tp.created_at,
      title: `Treatment Plan Created`,
      description: tp.name,
      status: tp.status
    })
  })

  // Sort descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No historical events found for this patient.</p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 ? (
                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                    ${event.type === 'appointment' ? 'bg-blue-100' :
                      event.type === 'clinical_record' ? 'bg-emerald-100' :
                      event.type === 'payment' ? 'bg-red-100' :
                      'bg-amber-100'
                    }`}
                  >
                    {event.type === 'appointment' && <Calendar className="h-4 w-4 text-blue-600" aria-hidden="true" />}
                    {event.type === 'clinical_record' && <FileText className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                    {event.type === 'payment' && <CreditCard className="h-4 w-4 text-red-600" aria-hidden="true" />}
                    {event.type === 'treatment_plan' && <Stethoscope className="h-4 w-4 text-amber-600" aria-hidden="true" />}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm text-gray-900 font-medium">
                      {event.title}
                    </p>
                    {event.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{event.description}</p>
                    )}
                    {event.status && (
                      <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 mt-1">
                        {event.status}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-500">
                    <time dateTime={event.date}>{format(parseISO(event.date), 'MMM d, yyyy h:mm a')}</time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
