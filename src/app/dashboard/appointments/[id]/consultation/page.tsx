import { getConsultationContext, getClinicalRecordForAppointment } from '@/features/clinical/services/clinicalService'
import PatientContextPanel from '@/features/clinical/components/PatientContextPanel'
import ConsultationForm from '@/features/clinical/components/ConsultationForm'
import { notFound, redirect } from 'next/navigation'

export const metadata = {
  title: 'Consultation | Smile Dental',
}

export default async function ConsultationPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const appointmentId = params.id

  let context
  try {
    context = await getConsultationContext(appointmentId)
  } catch (error) {
    notFound()
  }

  // Guard against invalid statuses
  const status = context.appointment.status
  if (status === 'CANCELLED' || status === 'NO_SHOW') {
    return (
      <div className="p-8 text-center text-gray-500">
        This appointment is {status}. A consultation cannot be started.
      </div>
    )
  }

  const existingRecord = await getClinicalRecordForAppointment(appointmentId)

  return (
    <div className="mx-auto max-w-7xl h-[calc(100vh-8rem)]">
      <div className="h-full flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 h-full">
          <PatientContextPanel context={context} />
        </div>
        <div className="w-full md:w-2/3 h-full">
          <ConsultationForm 
            appointment={context.appointment} 
            existingRecord={existingRecord} 
          />
        </div>
      </div>
    </div>
  )
}
