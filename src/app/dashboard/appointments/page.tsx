import { getAppointments } from '@/features/appointments/services/appointmentService'
import { AppointmentStatusButtons } from '@/features/appointments/components/AppointmentStatusButtons'
import { format, parseISO, addDays, subDays, startOfDay, endOfDay } from 'date-fns'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock } from 'lucide-react'
import { AppointmentStatus } from '@/lib/types/database.types'

function getStatusBadge(status: AppointmentStatus) {
  const styles: Record<string, string> = {
    SCHEDULED: 'bg-gray-100 text-gray-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    CHECKED_IN: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    NO_SHOW: 'bg-red-100 text-red-800'
  }
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${styles[status]}`}>{status.replace('_', ' ')}</span>
}

export default async function AppointmentsPage({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const resolvedParams = await searchParams
  const selectedDate = resolvedParams.date ? parseISO(resolvedParams.date) : new Date()
  const start = startOfDay(selectedDate)
  const end = endOfDay(selectedDate)

  const appointments = await getAppointments(start, end).catch(() => [])

  const prevDate = format(subDays(selectedDate, 1), 'yyyy-MM-dd')
  const nextDate = format(addDays(selectedDate, 1), 'yyyy-MM-dd')
  const today = format(new Date(), 'yyyy-MM-dd')

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Appointments</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your daily clinic schedule.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4" /> New Appointment
          </Link>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white px-4 py-3 shadow sm:rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/appointments?date=${prevDate}`} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h2 className="text-lg font-medium text-gray-900 min-w-[200px] text-center">
            {format(selectedDate, 'EEEE, dd MMMM yyyy')}
          </h2>
          <Link href={`/dashboard/appointments?date=${nextDate}`} className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
        <div>
          <Link href={`/dashboard/appointments?date=${today}`} className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Today
          </Link>
        </div>
      </div>

      {/* Agenda */}
      <div className="bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No appointments</h3>
            <p className="mt-1 text-sm text-gray-500">There are no appointments scheduled for this day.</p>
          </div>
        ) : (
          <ul role="list" className="divide-y divide-gray-200">
            {appointments.map((app) => (
              <li key={app.id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 flex-1">
                  <div className="flex flex-col min-w-[100px]">
                    <span className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {format(parseISO(app.scheduled_start), 'HH:mm')}
                    </span>
                    <span className="text-xs text-gray-500">{format(parseISO(app.scheduled_end), 'HH:mm')}</span>
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <Link href={`/dashboard/patients/${app.patient_id}`} className="text-base font-medium text-blue-600 hover:underline">
                      {app.patients?.name || 'Unknown Patient'}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-700">{app.reason}</span>
                      <span className="text-xs text-gray-500 border-l pl-2 ml-2">Src: {app.booking_source}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-3 sm:min-w-[200px]">
                  <div>{getStatusBadge(app.status)}</div>
                  <AppointmentStatusButtons id={app.id} currentStatus={app.status} />
                </div>
                
                <div className="hidden sm:block">
                  <Link href={`/dashboard/appointments/${app.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    View &rarr;
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
