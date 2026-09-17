'use client'

import { format, parseISO } from 'date-fns'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export function ImportBatchesTable({ batches }: { batches: any[] }) {
  if (batches.length === 0) {
    return (
      <div className="text-center bg-white rounded-lg border p-12">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No import batches</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by running a new import.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Import Date</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Source</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Filename</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Records</th>
            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Errors</th>
            <th className="relative px-6 py-3"><span className="sr-only">View</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {batches.map((batch) => (
            <tr key={batch.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                {format(parseISO(batch.imported_at), 'MMM d, yyyy h:mm a')}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {batch.source_system}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {batch.filename || '-'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                  batch.status === 'COMPLETED' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                  batch.status === 'PROCESSING' ? 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20' :
                  'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                }`}>
                  {batch.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 text-right font-medium">
                {batch.record_count}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-red-600 text-right">
                {batch.error_count > 0 ? batch.error_count : '-'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Link href={`/dashboard/migration/${batch.id}`} className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1">
                  Review <ChevronRight className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
