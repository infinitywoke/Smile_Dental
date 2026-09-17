import { format, parseISO } from 'date-fns'

export function PatientHistoricalTally({ records }: { records: any[] }) {
  if (!records || records.length === 0) return null

  return (
    <div className="bg-orange-50/50 shadow sm:rounded-lg border border-orange-200 mt-6">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-orange-200 bg-orange-50 sm:rounded-t-lg">
        <div>
          <h3 className="text-base font-semibold leading-6 text-orange-900">Historical Tally Records</h3>
          <p className="mt-1 max-w-2xl text-sm text-orange-700">
            Unverified legacy data imported from Tally. This does not represent canonical clinical truth.
          </p>
        </div>
      </div>
      <div className="border-t border-orange-200">
        <ul role="list" className="divide-y divide-orange-200">
          {records.map((record) => (
            <li key={record.id} className="p-4 sm:p-6 hover:bg-orange-50/80 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-orange-900">{format(parseISO(record.transaction_date), 'MMMM d, yyyy')}</p>
                  <p className="text-orange-800"><span className="font-medium">Source Ledger:</span> {record.raw_patient_identifier}</p>
                  <p className="text-orange-800 italic bg-white/50 p-2 rounded border border-orange-100">{record.raw_narration}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-bold text-orange-900">₹{record.raw_amount}</p>
                  <p className="text-orange-700">{record.raw_payment_mode}</p>
                  <p className="text-xs text-orange-500 mt-2 font-mono">ID: {record.source_record_id}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
