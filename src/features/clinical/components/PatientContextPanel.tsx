'use client'

import { ConsultationContext } from '../services/clinicalService'
import { format } from 'date-fns'

export default function PatientContextPanel({ context }: { context: ConsultationContext }) {
  const { patient, appointment, pastRecords, legacyRecords, activePlans } = context

  return (
    <div className="bg-white shadow sm:rounded-lg overflow-hidden flex flex-col h-full">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
        <h3 className="text-base font-semibold leading-6 text-gray-900">{patient.name}</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          {patient.phone}
        </p>
      </div>
      
      <div className="px-4 py-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
        
        {/* Appointment Context */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 border-b pb-2 mb-3">Current Appointment</h4>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Scheduled Time</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {format(new Date(appointment.scheduled_start), 'h:mm a')}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Reason</dt>
              <dd className="mt-1 text-sm text-gray-900">{appointment.reason || 'None specified'}</dd>
            </div>
          </dl>
        </div>

        {/* Active Treatment Plans */}
        {activePlans && activePlans.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-blue-900 border-b border-blue-200 pb-2 mb-3 flex justify-between items-center">
              Active Treatment
              <a href={`/dashboard/patients/${patient.id}`} target="_blank" className="text-xs text-blue-600 hover:underline">View All</a>
            </h4>
            <div className="space-y-3">
              {activePlans.map((plan: any) => (
                <div key={plan.id} className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm">
                  <div className="font-medium text-blue-900 mb-2">{plan.name}</div>
                  {plan.treatment_items && plan.treatment_items.length > 0 ? (
                    <ul className="space-y-2">
                      {plan.treatment_items.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-start text-xs">
                          <span className={`${item.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-blue-800 font-medium'}`}>
                            {item.procedure} {item.tooth_number ? `(${item.tooth_number})` : ''}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded ${
                            item.status === 'COMPLETED' ? 'bg-gray-200 text-gray-700' :
                            item.status === 'IN_PROGRESS' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-blue-700 italic">No items added yet</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clinical History */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 border-b pb-2 mb-3">Clinical History</h4>
          {pastRecords.length === 0 ? (
            <p className="text-sm text-gray-500">No previous clinical records.</p>
          ) : (
            <div className="space-y-4">
              {pastRecords.map(record => (
                <div key={record.id} className="bg-gray-50 p-3 rounded-md border text-sm">
                  <div className="font-medium text-gray-900 mb-1">
                    {format(new Date(record.created_at), 'MMM d, yyyy')}
                  </div>
                  {record.diagnosis && <div className="text-gray-700"><span className="font-medium">Dx:</span> {record.diagnosis}</div>}
                  {record.procedure_summary && <div className="text-gray-700"><span className="font-medium">Tx:</span> {record.procedure_summary}</div>}
                  {record.clinical_record_teeth && record.clinical_record_teeth.length > 0 && (
                    <div className="mt-1 text-xs text-blue-600 font-medium">
                      Teeth: {record.clinical_record_teeth.map((t: any) => t.tooth_number).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legacy Records */}
        {legacyRecords.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 border-b pb-2 mb-3 flex justify-between items-center">
              Historical Tally Record
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">Archive</span>
            </h4>
            <div className="space-y-3">
              {legacyRecords.slice(0, 3).map(lr => (
                <div key={lr.id} className="bg-yellow-50/50 p-3 rounded-md border border-yellow-100 text-sm">
                  <div className="font-medium text-gray-900 mb-1">
                    {format(new Date(lr.transaction_date), 'MMM d, yyyy')}
                  </div>
                  <div className="text-gray-700 whitespace-pre-wrap font-mono text-xs">{lr.raw_narration}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
