import { getAnalyticsOverview, getAcquisitionMetrics, getAppointmentMetrics, getTreatmentMetrics, getFinancialMetrics } from '@/features/analytics/services/analyticsService'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subMonths, format, parseISO } from 'date-fns'
import Link from 'next/link'
import { Users, CalendarCheck, FileText, IndianRupee, MousePointerClick, AlertCircle } from 'lucide-react'

// Define a type for our props that matches Next.js 15 requirements
type AnalyticsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function parseDateRange(rangeStr?: string) {
  const now = new Date()
  switch (rangeStr) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) }
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'last_month':
      const lm = subMonths(now, 1)
      return { start: startOfMonth(lm), end: endOfMonth(lm) }
    case 'month':
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

export default async function AnalyticsDashboard({ searchParams }: AnalyticsPageProps) {
  const resolvedSearchParams = await searchParams
  const rangeParam = typeof resolvedSearchParams.range === 'string' ? resolvedSearchParams.range : 'month'
  const dateRange = parseDateRange(rangeParam)

  const [overview, acquisition, appointments, treatments, financial] = await Promise.all([
    getAnalyticsOverview(dateRange),
    getAcquisitionMetrics(dateRange),
    getAppointmentMetrics(dateRange),
    getTreatmentMetrics(dateRange),
    getFinancialMetrics(dateRange)
  ])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight">
            Clinic Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
          </p>
        </div>
        <div className="mt-4 sm:ml-4 sm:mt-0 flex gap-2">
          {/* Time Filter Links */}
          <Link href="?range=today" className={`px-3 py-1.5 text-sm font-medium rounded-md ${rangeParam === 'today' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>Today</Link>
          <Link href="?range=week" className={`px-3 py-1.5 text-sm font-medium rounded-md ${rangeParam === 'week' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>This Week</Link>
          <Link href="?range=month" className={`px-3 py-1.5 text-sm font-medium rounded-md ${rangeParam === 'month' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>This Month</Link>
          <Link href="?range=last_month" className={`px-3 py-1.5 text-sm font-medium rounded-md ${rangeParam === 'last_month' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}>Last Month</Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* New Patients */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
          <dt className="truncate text-sm font-medium text-gray-500 flex items-center gap-2"><Users className="h-4 w-4 text-gray-400" /> New Patients</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{overview.newPatients}</dd>
        </div>
        
        {/* Completed Visits */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
          <dt className="truncate text-sm font-medium text-gray-500 flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-green-500" /> Completed Visits</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{overview.completedVisits}</dd>
        </div>

        {/* Payments Collected */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
          <dt className="truncate text-sm font-medium text-gray-500 flex items-center gap-2"><IndianRupee className="h-4 w-4 text-indigo-500" /> Payments Collected</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">₹{overview.modernPaymentsCollected.toLocaleString()}</dd>
        </div>

        {/* Booking Requests */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
          <dt className="truncate text-sm font-medium text-gray-500 flex items-center gap-2"><MousePointerClick className="h-4 w-4 text-blue-500" /> Booking Requests</dt>
          <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
            <div className="flex items-baseline text-3xl font-semibold text-gray-900">
              {overview.bookingRequests}
            </div>
            <div className={`inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0 bg-green-100 text-green-800`}>
              {overview.conversionRate.toFixed(1)}% converted
            </div>
          </dd>
        </div>

        {/* No Show Rate */}
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
          <dt className="truncate text-sm font-medium text-gray-500 flex items-center gap-2"><AlertCircle className="h-4 w-4 text-red-500" /> No-show Rate</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{overview.noShowRate.toFixed(1)}%</dd>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          {acquisition.funnel.requests === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">N/A (No requests)</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Requests</span>
                  <span className="text-gray-500">{acquisition.funnel.requests}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Contacted</span>
                  <span className="text-gray-500">{acquisition.funnel.contacted}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(acquisition.funnel.contacted / acquisition.funnel.requests) * 100}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">Converted</span>
                  <span className="text-gray-500">{acquisition.funnel.converted}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(acquisition.funnel.converted / acquisition.funnel.requests) * 100}%` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appointment Status */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Appointments Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-2xl font-semibold mt-1">{appointments.total}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="text-sm text-green-700">Completed</div>
              <div className="text-2xl font-semibold mt-1 text-green-900">{appointments.completed}</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="text-sm text-red-700">No Shows</div>
              <div className="text-2xl font-semibold mt-1 text-red-900">{appointments.noShow}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <div className="text-sm text-yellow-700">Cancelled</div>
              <div className="text-2xl font-semibold mt-1 text-yellow-900">{appointments.cancelled}</div>
            </div>
          </div>
        </div>

        {/* Treatment Activity */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Treatment Activity</h2>
          <dl className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-600">Treatment Plans Created</dt>
              <dd className="text-sm font-semibold text-gray-900">{treatments.plansCreated}</dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-600">Items Planned</dt>
              <dd className="text-sm font-semibold text-gray-900">{treatments.itemsPlanned}</dd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <dt className="text-sm text-gray-600">Items In Progress</dt>
              <dd className="text-sm font-semibold text-yellow-600">{treatments.itemsInProgress}</dd>
            </div>
            <div className="flex justify-between items-center py-2">
              <dt className="text-sm text-gray-600">Items Completed</dt>
              <dd className="text-sm font-semibold text-green-600">{treatments.itemsCompleted}</dd>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 p-3 rounded">
              <dt className="text-sm font-medium text-gray-900">Estimated Value Generated</dt>
              <dd className="text-sm font-bold text-gray-900">₹{treatments.estimatedValue.toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        {/* Financial */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Modern Payments Breakdown</h2>
          {financial.count === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">N/A (No payments)</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between text-sm mb-2 font-medium border-b pb-2">
                <span>Method</span>
                <span>Amount</span>
              </div>
              {Object.entries(financial.byMode).map(([mode, amount]) => (
                <div key={mode} className="flex justify-between text-sm">
                  <span className="text-gray-600">{mode.replace('_', ' ')}</span>
                  <span className="font-semibold text-gray-900">₹{amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between text-sm">
                <span className="text-gray-500">Average Payment Size</span>
                <span className="font-semibold text-gray-900">₹{financial.average.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>

      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Financial analytics only include verified modern payments. Historical Tally records are explicitly excluded from these totals to maintain strict financial integrity.
        </p>
      </div>

    </div>
  )
}
