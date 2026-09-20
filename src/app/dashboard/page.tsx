import { getDashboardData } from '@/features/dashboard/services/dashboardService'
import { getTodayActions } from '@/features/actions/services/nextActionEngine'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { Phone, Clock, ArrowRight, UserPlus, FileText, AlertCircle } from 'lucide-react'
import { AppointmentStatusButtons } from '@/features/appointments/components/AppointmentStatusButtons'

export default async function DashboardPage() {
  const [data, todayActions] = await Promise.all([
    getDashboardData().catch(() => null),
    getTodayActions().catch(() => [])
  ])

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

  const { todaysAppointments, upcomingAppointments } = data

  const inProgress = todaysAppointments.find(a => a.status === 'IN_PROGRESS')
  const waiting = todaysAppointments.filter(a => a.status === 'CHECKED_IN')
  const upcomingToday = todaysAppointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
  
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{greeting}, Dr. Rahil</h1>
          <p className="mt-1 text-sm text-gray-500">{formattedDate}</p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/dashboard/walk-in"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <UserPlus className="h-4 w-4" />
            Walk-in Patient
          </Link>
          <Link
            href="/dashboard/appointments/new"
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <Clock className="h-4 w-4" />
            Book Slot
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* NOW / IN CHAIR */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Now / In Chair</h2>
            {inProgress ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-emerald-900">{(inProgress.patients as any)?.name || 'Unknown'}</h3>
                    <p className="text-emerald-700 text-sm mt-1">{inProgress.reason}</p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded">
                    IN PROGRESS
                  </div>
                </div>
                <div className="mt-4 flex gap-3">
                  <Link href={`/dashboard/appointments/${inProgress.id}/consultation`} className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-emerald-500 flex items-center shadow-sm">
                    Open Clinical Hub <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                  <Link href={`/dashboard/patients/${inProgress.patient_id}`} className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-md text-sm font-semibold hover:bg-emerald-50 shadow-sm">
                    Patient Profile
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 border-dashed rounded-lg p-6 text-center text-gray-500 shadow-sm">
                No patient currently in the chair.
              </div>
            )}
          </section>

          {/* WAITING ROOM */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center justify-between">
              <span>Waiting Room</span>
              {waiting.length > 0 && (
                <span className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs font-semibold">{waiting.length}</span>
              )}
            </h2>
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              {waiting.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">Waiting room is empty.</div>
              ) : (
                <ul role="list" className="divide-y divide-gray-100">
                  {waiting.map((apt) => (
                    <li key={`apt-${apt.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{(apt.patients as any)?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-600 mt-0.5">{apt.reason}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {format(parseISO(apt.scheduled_start), 'h:mm a')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {(apt.patients as any)?.phone || 'No phone'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <AppointmentStatusButtons id={apt.id} currentStatus={apt.status} />
                          <Link href={`/dashboard/patients/${apt.patient_id}`} className="text-xs text-blue-600 font-medium hover:text-blue-500">
                            View File &rarr;
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* UP NEXT TODAY */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Up Next</h2>
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              {upcomingToday.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">No more appointments scheduled today.</div>
              ) : (
                <ul role="list" className="divide-y divide-gray-100">
                  {upcomingToday.map((apt) => (
                    <li key={`apt-${apt.id}`} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                          <div className="w-16 flex-shrink-0 text-center">
                            <div className="text-xs font-bold text-gray-900">{format(parseISO(apt.scheduled_start), 'h:mm a')}</div>
                            <div className="text-[10px] text-gray-500 uppercase">{apt.status}</div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{(apt.patients as any)?.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-600 mt-0.5">{apt.reason}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <AppointmentStatusButtons id={apt.id} currentStatus={apt.status} />
                        </div>
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
          
          {/* ACTION CENTER SECTION */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-600 mb-3 flex items-center justify-between">
              <span>Needs Attention</span>
              {todayActions.length > 0 && (
                <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-semibold">{todayActions.length}</span>
              )}
            </h2>
            
            <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              {todayActions.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">All caught up!</div>
              ) : (
                <ul role="list" className="divide-y divide-gray-100">
                  {todayActions.map((action) => {
                    let badgeClass = "bg-gray-100 text-gray-700 border-gray-200"
                    if (action.priority === 'URGENT') badgeClass = "bg-red-50 text-red-700 border-red-200"
                    else if (action.priority === 'HIGH') badgeClass = "bg-purple-50 text-purple-700 border-purple-200"
                    else if (action.priority === 'NORMAL') badgeClass = "bg-amber-50 text-amber-700 border-amber-200"

                    return (
                      <li key={action.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50 group">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-semibold text-gray-900">{action.patientName}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${badgeClass}`}>
                            {action.priority}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-gray-800">{action.title}</span>
                        <span className="text-xs text-gray-600 mt-0.5 line-clamp-2">{action.description}</span>
                        
                        <div className="flex justify-between items-end mt-1">
                          <span className="text-[10px] text-gray-400">
                            {format(parseISO(action.timestamp), 'MMM d')}
                          </span>
                          <Link href={action.actionUrl} className="text-xs text-blue-600 font-medium hover:text-blue-500 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            RESOLVE <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
