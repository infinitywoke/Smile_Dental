import { getPatientProfile } from '@/features/patients/services/patientService'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Edit, Phone, Calendar, CreditCard, Activity, FileText, FileClock, MapPin } from 'lucide-react'
import { TreatmentPlansSection } from '@/features/treatments/components/TreatmentPlansSection'
import { PatientPaymentsSection } from '@/features/payments/components/PatientPaymentsSection'
import { getPatientPayments, getPatientFinancialSummary } from '@/features/payments/services/paymentService'
import { PatientHistoricalTally } from '@/features/migration/components/PatientHistoricalTally'
import { getPatientRelationships } from '@/features/patients/services/relationshipService'
import { PatientRelationshipsSection } from '@/features/patients/components/PatientRelationshipsSection'
import { getPatientSpecialistReferrals } from '@/features/treatments/actions/specialistReferralActions'
import { SpecialistReferralsSection } from '@/features/treatments/components/SpecialistReferralsSection'

function computeAge(dob: string | null) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  const age = new Date(diff).getUTCFullYear() - 1970
  return age
}

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const patient = await getPatientProfile(resolvedParams.id)
  
  if (!patient) {
    notFound()
  }

  const payments = await getPatientPayments(resolvedParams.id)
  const financialSummary = await getPatientFinancialSummary(resolvedParams.id)
  const relationships = await getPatientRelationships(resolvedParams.id)
  const specialistReferrals = await getPatientSpecialistReferrals(resolvedParams.id)
  const activePlans = (patient.treatment_plans || []).filter((p: any) => p.status === 'ACTIVE')

  const latestAppointment = patient.appointments?.[0]
  const hasLegacyOnly = (patient.legacy_records?.length ?? 0) > 0 && 
                        (patient.clinical_records?.length ?? 0) === 0 &&
                        (patient.appointments?.length ?? 0) === 0

  const age = computeAge(patient.date_of_birth)

  return (
    <div className="space-y-8">
      {/* HEADER OVERVIEW */}
      <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:px-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight flex items-center gap-2">
              {patient.name}
              {age !== null && (
                <span className="text-sm font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {age} yrs
                </span>
              )}
            </h1>
            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Phone className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                {patient.phone || 'No phone'}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                DOB: {patient.date_of_birth ? format(parseISO(patient.date_of_birth), 'dd MMM yyyy') : 'Unknown'}
              </div>
              {(patient.location || patient.city) && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <MapPin className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  {[patient.location, patient.city].filter(Boolean).join(', ')}
                </div>
              )}
            </div>
            {patient.address && (
              <p className="mt-2 text-sm text-gray-500">{patient.address}</p>
            )}
            
            {hasLegacyOnly && (
              <div className="mt-3 inline-flex items-center gap-x-1.5 rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                <FileClock className="h-4 w-4" />
                Historical records available (Imported from Tally)
              </div>
            )}
          </div>
          <div className="flex shrink-0">
            <Link
              href={`/dashboard/patients/${patient.id}/edit`}
              className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <Edit className="-ml-0.5 h-4 w-4" />
              Edit
            </Link>
          </div>
        </div>

        {/* SMART QUICK ACTIONS */}
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3">
          <Link
            href={`/dashboard/appointments/new?patientId=${patient.id}`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-inset ring-blue-600/20 hover:bg-blue-100"
          >
            <Calendar className="h-4 w-4" /> Book Appointment
          </Link>
          <Link
            href={`/dashboard/appointments/new?patientId=${patient.id}&source=WALK_IN`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 shadow-sm ring-1 ring-inset ring-green-600/20 hover:bg-green-100"
          >
            <Activity className="h-4 w-4" /> Start Consultation (Walk-In)
          </Link>
          <a
            href="#clinical-history"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" /> View History
          </a>
        </div>
        
        <div className="mt-6 border-t border-gray-100 pt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Patient Since</dt>
            <dd className="mt-1 text-sm text-gray-900">{format(parseISO(patient.created_at), 'MMM yyyy')}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Latest Appointment</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {latestAppointment ? format(parseISO(latestAppointment.scheduled_start), 'dd MMM yyyy') : 'None'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Active Treatment</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {patient.treatment_plans?.some((p: any) => p.treatment_items?.some((i: any) => i.status === 'IN_PROGRESS')) ? 'Yes' : 'No'}
            </dd>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* APPOINTMENTS */}
        <section className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" /> Appointments
          </h2>
          <div className="bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden">
            {(!patient.appointments || patient.appointments.length === 0) ? (
              <div className="p-6 text-center text-sm text-gray-500">No appointments found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patient.appointments.map(app => (
                    <tr key={app.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(parseISO(app.scheduled_start), 'dd MMM yyyy, HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.reason}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.status}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.booking_source}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {app.status === 'IN_PROGRESS' && (
                          <Link href={`/dashboard/appointments/${app.id}/consultation`} className="text-purple-600 hover:text-purple-900">
                            Continue
                          </Link>
                        )}
                        <Link href={`/dashboard/appointments/${app.id}`} className="text-blue-600 hover:text-blue-900">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* CLINICAL HISTORY */}
        <section id="clinical-history" className="space-y-4">
          <h2 className="text-lg font-medium leading-6 text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" /> Clinical History
          </h2>
          <div className="bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden">
            {(!patient.clinical_records || patient.clinical_records.length === 0) ? (
              <div className="p-6 text-center text-sm text-gray-500">No clinical records yet.</div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {patient.clinical_records.map(record => (
                  <li key={record.id} className="p-4 sm:px-6">
                    <div className="flex justify-between">
                      <Link href={`/dashboard/appointments/${record.appointment_id}/consultation`} className="text-sm font-medium text-blue-600 hover:text-blue-900">
                        {format(parseISO(record.created_at), 'dd MMM yyyy')} - View Consultation
                      </Link>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      {record.chief_complaint && <p><span className="font-medium">CC:</span> {record.chief_complaint}</p>}
                      {record.diagnosis && <p><span className="font-medium">Dx:</span> {record.diagnosis}</p>}
                      {record.procedure_summary && <p><span className="font-medium">Tx:</span> {record.procedure_summary}</p>}
                    </div>
                    {(record.clinical_record_teeth?.length ?? 0) > 0 && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Teeth: </span>
                        {record.clinical_record_teeth?.map((t: any) => `${t.tooth_number} (${t.notes})`).join(', ')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* SPECIALIST REFERRALS */}
        <section className="space-y-4">
          <SpecialistReferralsSection patientId={patient.id} initialReferrals={specialistReferrals as any} />
        </section>

        {/* RELATIONSHIPS */}
        <section className="space-y-4">
          <PatientRelationshipsSection patientId={patient.id} initialRelationships={relationships as any} />
        </section>

        {/* TREATMENT PLANS */}
        <section className="space-y-4">
          <TreatmentPlansSection patientId={patient.id} initialPlans={patient.treatment_plans as any} />
        </section>

        {/* PAYMENTS */}
        <section className="space-y-4">
          <PatientPaymentsSection 
            patientId={patient.id} 
            initialPayments={payments} 
            financialSummary={financialSummary}
            activePlans={activePlans}
          />
        </section>

        {/* HISTORICAL TALLY RECORDS */}
        <PatientHistoricalTally records={patient.legacy_records || []} />

      </div>
    </div>
  )
}
