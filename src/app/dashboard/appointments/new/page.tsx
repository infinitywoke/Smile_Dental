import { AppointmentForm } from '@/features/appointments/components/AppointmentForm'
import { getPatients } from '@/features/patients/services/patientService'
import { getAppointments } from '@/features/appointments/services/appointmentService'
import { getBookingRequest } from '@/features/bookings/services/bookingService'
import { format, addDays } from 'date-fns'

export default async function NewAppointmentPage({
  searchParams
}: {
  searchParams: Promise<{ patientId?: string, source?: string, requestId?: string, specialist_referral_id?: string, specialist_name?: string }>
}) {
  const params = await searchParams
  const patients = await getPatients()
  
  // Fetch next 7 days of appointments for the agenda
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const nextWeek = addDays(today, 8)
  const appointments = await getAppointments(today, nextWeek)
  
  // Optional: fetch booking request if there's one
  let bookingRequest = null
  let initialData: any = undefined
  
  if (params.patientId) {
    initialData = {
      patient_id: params.patientId,
      booking_source: params.source || 'WEBSITE',
      specialist_referral_id: params.specialist_referral_id || undefined,
      assigned_specialist: params.specialist_name || undefined
    }
  }

  if (params.requestId) {
    try {
      bookingRequest = await getBookingRequest(params.requestId)
      if (bookingRequest) {
        // Compute default date/time from preferred
        const prefDate = bookingRequest.preferred_date || format(new Date(), 'yyyy-MM-dd')
        let prefTime = bookingRequest.preferred_time || '09:00:00'
        
        // Handle AM/PM format from 12-hour clock (if the string has AM/PM)
        if (prefTime.toUpperCase().includes('M')) {
          const isPM = prefTime.toUpperCase().includes('PM')
          let [timePart] = prefTime.split(' ')
          let [hh, mm] = timePart.split(':')
          let hour = parseInt(hh, 10)
          if (isPM && hour < 12) hour += 12
          if (!isPM && hour === 12) hour = 0
          prefTime = `${String(hour).padStart(2, '0')}:${mm}:00`
        }
        
        // Create scheduled_start (e.g. 2026-09-15T09:00:00)
        const scheduledStart = `${prefDate}T${prefTime}`
        
        // Compute scheduled_end (+1 hour)
        let hourStr = prefTime.split(':')[0]
        let endHour = parseInt(hourStr, 10) + 1
        const endTimeStr = String(endHour).padStart(2, '0') + ':' + prefTime.split(':')[1] + ':00'
        const scheduledEnd = `${prefDate}T${endTimeStr}`
        
        initialData = {
          ...initialData,
          reason: bookingRequest.reason,
          notes: bookingRequest.notes,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd
        }
      }
    } catch(e) {
      console.error(e)
    }
  }

  // Render agenda logic
  // Group appointments by date
  const agendaByDate: Record<string, any[]> = {}
  appointments.forEach(app => {
    // Only show valid appointments
    if (app.status === 'CANCELLED' || app.status === 'NO_SHOW') return
    const d = app.scheduled_start.split('T')[0]
    if (!agendaByDate[d]) agendaByDate[d] = []
    agendaByDate[d].push(app)
  })

  // Sort dates
  const sortedDates = Object.keys(agendaByDate).sort()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-6 text-gray-900">New Appointment</h1>
        <p className="mt-2 text-sm text-gray-700">
          Schedule a new visit for a patient.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AppointmentForm 
            patients={patients.map(p => ({id: p.id, name: p.name}))}
            initialData={initialData}
          />
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Doctor's Schedule (Next 7 Days)</h3>
          
          {sortedDates.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming appointments.</p>
          ) : (
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
              {sortedDates.map(date => (
                <div key={date}>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 border-b pb-1">
                    {format(new Date(date), 'EEEE, MMM d, yyyy')}
                  </h4>
                  <div className="space-y-2">
                    {agendaByDate[date].sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start)).map(app => {
                      const startTime = format(new Date(app.scheduled_start), 'h:mm a')
                      const endTime = format(new Date(app.scheduled_end), 'h:mm a')
                      return (
                        <div key={app.id} className="bg-white p-3 rounded shadow-sm border border-gray-100 text-sm">
                          <div className="font-medium text-gray-900">{startTime} - {endTime}</div>
                          <div className="text-gray-600 font-medium">{(app as any).patients?.name || 'Unknown patient'}</div>
                          <div className="text-gray-500 text-xs mt-1 truncate">{app.reason}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
