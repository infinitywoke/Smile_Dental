import { getDashboardData } from '@/features/dashboard/services/dashboardService'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { Phone, Clock, ArrowRight, UserPlus, FileText } from 'lucide-react'
import { AppointmentStatusButtons } from '@/features/appointments/components/AppointmentStatusButtons'

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

  const { todaysAppointments, pendingRequests, upcomingAppointments } = data

  const inProgress = todaysAppointments.find(a => a.status === 'IN_PROGRESS')
  const waiting = todaysAppointments.filter(a => a.status === 'CHECKED_IN')
  const upcomingToday = todaysAppointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
  const needsAttention = pendingRequests

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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/walk-in"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <UserPlus className="h-5 w-5" />
            WALK-IN
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* NOW SECTION */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={inProgress ? "animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" : "absolute inline-flex h-full w-full rounded-full bg-gray-300"}></span>
                <span className={inProgress ? "relative inline-flex rounded-full h-3 w-3 bg-green-500" : "relative inline-flex rounded-full h-3 w-3 bg-gray-400"}></span>
              </span>
              Now In Chair
            </h2>
            
            {inProgress ? (
              <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden ring-1 ring-green-500">
                <div className="p-6 sm:p-8 bg-gradient-to-br from-green-50 to-white">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{inProgress.patients?.name || 'Unknown Patient'}</h3>
                      <p className="text-gray-600 mt-1 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        Started at {format(parseISO(inProgress.scheduled_start), 'h:mm a')}
                      </p>
                      <p className="text-gray-800 font-medium mt-2">
                        {inProgress.reason || 'General Consultation'}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/appointments/${inProgress.id}/consultation`}
                      className="inline-flex items-center gap-2 rounded-md bg-green-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 w-full sm:w-auto justify-center"
                    >
                      <FileText className="h-5 w-5" />
                      OPEN ENCOUNTER
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <p className="text-gray-500 font-medium">Chair is empty</p>
                <p className="text-sm text-gray-400 mt-1">Ready for next patient</p>
              </div>
            )}
          </section>

          {/* WAITING SECTION */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center justify-between">
              <span>Waiting Room</span>
              <span className="bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full text-xs font-semibold">{waiting.length} waiting</span>
            </h2>
            
            <div className="space-y-3">
              {waiting.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm">
                  <p className="text-gray-500 text-sm">No one is currently waiting.</p>
                </div>
              ) : (
                waiting.map(app => (
                  <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-300 transition-colors">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{app.patients?.name || 'Unknown Patient'}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          {format(parseISO(app.scheduled_start), 'h:mm a')}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{app.reason}</span>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto">
                      <AppointmentStatusButtons id={app.id} currentStatus={app.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* UP NEXT SECTION */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Up Next Today</h2>
            <div className="bg-white shadow-sm ring-1 ring-black ring-opacity-5 rounded-lg overflow-hidden">
              {upcomingToday.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">No more appointments scheduled for today.</div>
              ) : (
                <ul role="list" className="divide-y divide-gray-100">
                  {upcomingToday.map((app) => (
                    <li key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{app.patients?.name || 'Unknown Patient'}</span>
                        <span className="text-xs text-gray-500">{app.reason}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="text-sm font-medium text-gray-700">{format(parseISO(app.scheduled_start), 'h:mm a')}</span>
                        <AppointmentStatusButtons id={app.id} currentStatus={app.status} />
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
          
          {/* NEEDS ATTENTION SECTION */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-3 flex items-center justify-between">
              <span>Needs Attention</span>
              {needsAttention.length > 0 && (
                <span className="bg-red-100 text-red-700 py-0.5 px-2 rounded-full text-xs font-semibold">{needsAttention.length}</span>
              )}
            </h2>
            
            <div className="bg-white shadow-sm border border-red-100 rounded-lg overflow-hidden">
              {needsAttention.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">All caught up!</div>
              ) : (
                <ul role="list" className="divide-y divide-gray-100">
                  {needsAttention.map((req) => (
                    <li key={req.id} className="p-4 flex flex-col gap-2 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-gray-900">{req.name}</span>
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">New Request</span>
                      </div>
                      <span className="text-xs text-gray-600 flex items-center gap-1"><Phone className="h-3 w-3 text-gray-400" /> {req.phone}</span>
                      <span className="text-xs text-gray-500 mt-1 line-clamp-2 bg-gray-50 p-2 rounded border border-gray-100">{req.reason}</span>
                      <Link href={`/dashboard/requests`} className="text-xs text-blue-600 font-medium hover:text-blue-500 flex items-center mt-1">
                        View Request <ArrowRight className="h-3 w-3 ml-1" />
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
