import { createClient } from '@/utils/supabase/server'
import { ImportBatchesTable } from '@/features/migration/components/ImportBatchesTable'
import Link from 'next/link'
import { Database, FileUp } from 'lucide-react'

export const metadata = {
  title: 'Data Migration | Smile Dental'
}

export default async function MigrationDashboardPage() {
  const supabase = await createClient()
  
  const { data: batches } = await supabase
    .from('import_batches')
    .select('*')
    .order('imported_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-6 text-gray-900">Historical Data Migration</h1>
          <p className="mt-2 text-sm text-gray-700">
            Import, review, and reconcile historical records from legacy systems (e.g., Tally) to modern canonical patients.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <Link
            href="/dashboard/migration/import"
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <FileUp className="h-4 w-4" />
            New Import
          </Link>
        </div>
      </div>

      <ImportBatchesTable batches={batches || []} />
    </div>
  )
}
