import { getDashboardData } from '@/features/dashboard/services/dashboardService'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { Calendar as CalendarIcon, Clock, CheckCircle2, User, Phone, CheckSquare } from 'lucide-react'
import { AppointmentStatus, BookingRequestStatus } from '@/lib/types/database.types'
import { AppointmentStatusButtons } from '@/features/appointments/components/AppointmentStatusButtons'

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

function getRequestBadge(status: BookingRequestStatus) {
  const styles: Record<string, string> = {
    NEW: 'bg-red-100 text-red-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    CONVERTED: 'bg-green-100 text-green-800',
  }
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>
}

export default async function DashboardPage() {
  const data = await getDashboardData().catch(() => null)

  if (!data) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <h3 className="text-sm font-medium text-red-800">Database Connection Pending</h3>
        <div className="mt-2 text-sm text-red-700">
          <p>Local Supabase could not be connected. Operational dashboard loaded in error state to prove UI logic without fabricating data.</p>
        </div>
      </div>
    )
  }

  const { todaysAppointments, pendingRequests, recentPatients, upcomingAppointments } = data

  const stats = [
    { name: "Today's Appointments", stat: todaysAppointments.length, icon: CalendarIcon },
    { name: "Checked In", stat: todaysAppointments.filter(a => a.status === 'CHECKED_IN').length, icon: CheckSquare },
    { name: "Completed", stat: todaysAppointments.filter(a => a.status === 'COMPLETED').length, icon: CheckCircle2 },
    { name: "Pending Requests", stat: pendingRequests.length, icon: Clock },
  ]

  const istHour = parseInt(new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', hourCycle: 'h23' }).format(new Date()))
  const greeting = istHour < 12 ? 'Good morning' : istHour < 17 ? 'Good afternoon' : 'Good evening'
  
  const formattedDate = new Intl.DateTimeFormat('en-IN', { 
    timeZone: 'Asia/Kolkata', 
    weekday: 'long', 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date())

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold leading-6 text-gray-900">{greeting}, Dr. Rahil</h1>
        <p className="mt-2 text-sm text-gray-700">{formattedDate}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-gray-100">
            <dt>
              <div className="absolute rounded-md bg-blue-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
            </dd>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          <section>
            <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4">Today&apos;s Schedule</h2>
            <div className="bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg overflow-hidden">
              {todaysAppointments.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-500">No appointments scheduled for today.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Time</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Patient</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reason</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {todaysAppointments.map((app) => (
                      <tr key={app.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {format(parseISO(app.scheduled_start), 'h:mm a')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {app.patients?.name || 'Unknown'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{app.reason}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex flex-col gap-2 items-start">
                            {getStatusBadge(app.status)}
                            <AppointmentStatusButtons id={app.id} currentStatus={app.status} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4">Upcoming Appointments</h2>
            <div className="bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg overflow-hidden">
              {upcomingAppointments.length === 0 ? (
                <div className="p-12 text-center text-sm text-gray-500">No upcoming appointments.</div>
              ) : (
                <ul role="list" className="divide-y divide-gray-200">
                  {upcomingAppointments.map((app) => (
                    <li key={app.id} className="p-4 sm:px-6 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{app.patients?.name || 'Unknown'}</span>
                        <span className="text-sm text-gray-500">{format(parseISO(app.scheduled_start), 'MMM dd, h:mm a')}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{app.reason}</span>
                        {getStatusBadge(app.status)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          <section>
            <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4">Pending Requests</h2>
            <div className="bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg overflow-hidden">
              {pendingRequests.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">All caught up!</div>
              ) : (
                <ul role="list" className="divide-y divide-gray-200">
                  {pendingRequests.map((req) => (
                    <li key={req.id} className="p-4 sm:px-6 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900">{req.name}</span>
                        {getRequestBadge(req.status)}
                      </div>
                      <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {req.phone}</span>
                      <span className="text-xs text-gray-600 mt-1 line-clamp-1">{req.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4">Recent Patients</h2>
            <div className="bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg overflow-hidden">
              {recentPatients.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">No patients found.</div>
              ) : (
                <ul role="list" className="divide-y divide-gray-200">
                  {recentPatients.map((patient) => (
                    <li key={patient.id} className="hover:bg-gray-50">
                      <Link href={`/dashboard/patients/${patient.id}`} className="block p-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{patient.name}</span>
                              <span className="text-xs text-gray-500">{patient.phone}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
