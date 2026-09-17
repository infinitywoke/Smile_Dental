import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LegacyRecordReviewList } from '@/features/migration/components/LegacyRecordReviewList'
import { format, parseISO } from 'date-fns'

export default async function BatchReviewPage({ params }: { params: Promise<{ batchId: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: batch } = await supabase.from('import_batches').select('*').eq('id', resolvedParams.batchId).single()
  if (!batch) notFound()

  // Fetch legacy records for this batch
  const { data: records } = await supabase
    .from('legacy_records')
    .select(`
      *,
      patient:patients(id, name, phone)
    `)
    .eq('import_batch_id', batch.id)
    .order('transaction_date', { ascending: false })

  // Calculate stats
  const total = records?.length || 0
  const autoMatched = records?.filter(r => r.match_status === 'AUTO_MATCHED').length || 0
  const manualReview = records?.filter(r => r.match_status === 'MANUAL_REVIEW').length || 0
  const unmatched = records?.filter(r => r.match_status === 'UNMATCHED').length || 0
  const confirmed = records?.filter(r => r.match_status === 'CONFIRMED').length || 0

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <Link href="/dashboard/migration" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Migration
        </Link>
      </div>

      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Review Batch: {batch.filename}</h1>
          <p className="mt-2 text-sm text-gray-700">
            Imported on {format(parseISO(batch.imported_at), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-5">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border">
          <dt className="truncate text-sm font-medium text-gray-500">Total Records</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{total}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-green-200">
          <dt className="truncate text-sm font-medium text-green-600">Auto Matched</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-green-700">{autoMatched}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-yellow-200">
          <dt className="truncate text-sm font-medium text-yellow-600">Needs Review</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-yellow-700">{manualReview}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-200">
          <dt className="truncate text-sm font-medium text-gray-500">Unmatched</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{unmatched}</dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-blue-200">
          <dt className="truncate text-sm font-medium text-blue-600">Confirmed</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-blue-700">{confirmed}</dd>
        </div>
      </dl>

      <LegacyRecordReviewList initialRecords={records || []} />
    </div>
  )
}
