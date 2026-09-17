import { getBookingRequests } from '@/features/bookings/services/bookingService'
import { BookingRequestsDashboard } from '@/features/bookings/components/BookingRequestsDashboard'

export const metadata = {
  title: 'Booking Requests - Smile Dental Clinic',
}

export default async function BookingRequestsPage() {
  const requests = await getBookingRequests()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Booking Requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage prospective patient inquiries and convert them to actual patients.
        </p>
      </div>

      <BookingRequestsDashboard initialRequests={requests || []} />
    </div>
  )
}
