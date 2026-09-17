import { AppointmentForm } from '@/features/appointments/components/AppointmentForm'
import { getAppointment } from '@/features/appointments/services/appointmentService'
import { notFound } from 'next/navigation'

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const appointment = await getAppointment(resolvedParams.id)

  if (!appointment) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold leading-6 text-gray-900">Reschedule / Edit Appointment</h1>
        <p className="mt-2 text-sm text-gray-700">
          Modify the appointment details for {appointment.patients?.name || 'this patient'}.
        </p>
      </div>
      <AppointmentForm initialData={appointment} appointmentId={appointment.id} patients={[]} />
    </div>
  )
}
