import { getAppointment } from '@/features/appointments/services/appointmentService'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Edit, User, Phone, Calendar, Clock, Stethoscope, ClipboardList } from 'lucide-react'
import { AppointmentStatusButtons } from '@/features/appointments/components/AppointmentStatusButtons'

export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const appointment = await getAppointment(resolvedParams.id)

  if (!appointment) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow sm:rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start border-b border-gray-200">
          <div>
            <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" /> Appointment Details
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Created for {appointment.patients?.name || 'Unknown Patient'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/appointments/${appointment.id}/edit`}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <Edit className="-ml-0.5 h-4 w-4 text-gray-400" />
              Reschedule / Edit
            </Link>
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-8">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" /> Patient
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link href={`/dashboard/patients/${appointment.patient_id}`} className="text-blue-600 hover:underline">
                  {appointment.patients?.name || 'Unknown Patient'}
                </Link>
              </dd>
            </div>
            
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" /> Phone
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{appointment.patients?.phone || 'No phone'}</dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" /> Date & Time
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(parseISO(appointment.scheduled_start), 'EEEE, dd MMMM yyyy')}
                <br />
                {format(parseISO(appointment.scheduled_start), 'h:mm a')} - {format(parseISO(appointment.scheduled_end), 'h:mm a')}
              </dd>
            </div>

            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-gray-400" /> Assigned Specialist
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{appointment.assigned_specialist || 'None specified'}</dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-gray-400" /> Reason for Visit
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{appointment.reason}</dd>
            </div>
            
            {appointment.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{appointment.notes}</dd>
              </div>
            )}
            
            <div className="sm:col-span-2 border-t pt-6 mt-2">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Quick Actions</h4>
              <AppointmentStatusButtons id={appointment.id} currentStatus={appointment.status} />
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
