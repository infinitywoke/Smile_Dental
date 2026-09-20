import { getPatientProfile } from '@/features/patients/services/patientService'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { Edit, Phone, Calendar, CreditCard, Activity, FileText, FileClock, MapPin, User, Clock, Stethoscope } from 'lucide-react'
import { TreatmentPlansSection } from '@/features/treatments/components/TreatmentPlansSection'
import { PatientPaymentsSection } from '@/features/payments/components/PatientPaymentsSection'
import { getPatientPayments, getPatientFinancialSummary } from '@/features/payments/services/paymentService'
import { PatientHistoricalTally } from '@/features/migration/components/PatientHistoricalTally'
import { getPatientRelationships } from '@/features/patients/services/relationshipService'
import { PatientRelationshipsSection } from '@/features/patients/components/PatientRelationshipsSection'
import { getPatientSpecialistReferrals } from '@/features/treatments/actions/specialistReferralActions'
import { SpecialistReferralsSection } from '@/features/treatments/components/SpecialistReferralsSection'
import { NextActionCard } from '@/features/patients/components/NextActionCard'
import { PatientTimeline } from '@/features/patients/components/PatientTimeline'
import { getPatientNextAction } from '@/features/actions/services/nextActionEngine'

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
  const pendingReferrals = specialistReferrals?.filter((r: any) => r.status === 'PENDING_ADVANCE' || r.status === 'ADVANCE_PAID') || []

  // Next Appointment Check
  const now = new Date()
  const upcomingAppointment = patient.appointments?.find(a => new Date(a.scheduled_start) > now)

  const age = computeAge(patient.date_of_birth)
  
  const latestAppointment = patient.appointments?.[0]
  const hasActiveTreatment = activePlans.length > 0

  const nextAction = await getPatientNextAction(patient.id)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* 1. IDENTITY & STATE BLOCK */}
      <div className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200">
        <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-blue-700">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:tracking-tight flex items-center gap-2">
                {patient.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                {patient.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {patient.phone}</span>
                )}
                {age !== null && (
                  <span className="flex items-center gap-1"><User className="h-4 w-4" /> {age} yrs</span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Last Visit: {latestAppointment ? format(parseISO(latestAppointment.scheduled_start), 'MMM d, yyyy') : 'None'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/patients/${patient.id}/edit`}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              <Edit className="h-4 w-4" /> Edit Profile
            </Link>
          </div>
        </div>
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-4 sm:px-6">
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white px-4 py-3 rounded-lg border border-gray-100 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Active Treatment</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">{hasActiveTreatment ? 'Yes' : 'No'}</dd>
            </div>
            <div className="bg-white px-4 py-3 rounded-lg border border-gray-100 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Upcoming Visit</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {upcomingAppointment ? format(parseISO(upcomingAppointment.scheduled_start), 'MMM d, yyyy') : 'None Scheduled'}
              </dd>
            </div>
            <div className="bg-white px-4 py-3 rounded-lg border border-gray-100 shadow-sm">
              <dt className="text-sm font-medium text-gray-500">Outstanding Balance</dt>
              <dd className={`mt-1 text-lg font-semibold ${financialSummary.totalRemaining > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                ₹{financialSummary.totalRemaining.toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 2. NEXT ACTION COMMAND */}
      <NextActionCard action={nextAction} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN: TIMELINE */}
        <div className="lg:col-span-1 space-y-6">
          <section>
            <h2 className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4">
              <FileClock className="h-5 w-5 text-blue-500" /> Patient Timeline
            </h2>
            <div className="bg-white shadow sm:rounded-lg border border-gray-200 p-6 overflow-hidden">
              <PatientTimeline 
                appointments={patient.appointments} 
                clinicalRecords={patient.clinical_records} 
                payments={payments} 
                treatmentPlans={patient.treatment_plans} 
              />
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: WORKFLOW COMPONENTS */}
        <div className="lg:col-span-2 space-y-6">
          {/* TREATMENT PLANS (UPGRADED) */}
          <section id="treatments">
            <h2 className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4">
              <Stethoscope className="h-5 w-5 text-amber-500" /> Treatment Progress
            </h2>
            <TreatmentPlansSection patientId={patient.id} initialPlans={patient.treatment_plans as any} />
          </section>

          {/* PAYMENTS */}
          <section id="payments">
            <h2 className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-green-500" /> Financials & Payments
            </h2>
            <PatientPaymentsSection 
              patientId={patient.id} 
              initialPayments={payments} 
              financialSummary={financialSummary}
              activePlans={activePlans}
            />
          </section>

          {/* SPECIALIST REFERRALS */}
          <section id="referrals">
            <h2 className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4">
              <Activity className="h-5 w-5 text-purple-500" /> Specialist Referrals
            </h2>
            <SpecialistReferralsSection patientId={patient.id} initialReferrals={specialistReferrals as any} />
          </section>

          {/* RELATIONSHIPS */}
          <section id="relationships">
            <h2 className="text-lg font-bold leading-6 text-gray-900 flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-gray-500" /> Family & Relationships
            </h2>
            <PatientRelationshipsSection patientId={patient.id} initialRelationships={relationships as any} />
          </section>

          {/* HISTORICAL TALLY RECORDS */}
          {(patient.legacy_records?.length ?? 0) > 0 && (
            <PatientHistoricalTally records={patient.legacy_records || []} />
          )}
        </div>
      </div>
    </div>
  )
}
