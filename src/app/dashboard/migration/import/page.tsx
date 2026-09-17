import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { processTallyImport } from '@/features/migration/services/importService'
import * as fs from 'fs'
import * as path from 'path'

export default async function ImportTestPage() {
  const handleTestImport = async () => {
    'use server'
    const filePath = path.join(process.cwd(), 'scratch', 'test-tally-export.json')
    if (!fs.existsSync(filePath)) {
      throw new Error('Test export file not found in scratch directory')
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const records = JSON.parse(fileContent)
    
    const result = await processTallyImport(records, 'test-tally-export.json')
    
    redirect(`/dashboard/migration/${result.batchId}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white shadow sm:rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Run Migration Dry Run</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>This will run the synthetic data import pipeline using `scratch/test-tally-export.json`.</p>
            <p className="mt-2 text-red-600 font-medium">WARNING: Do not upload real clinic exports during this phase.</p>
          </div>
          <div className="mt-5">
            <form action={handleTestImport}>
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Execute Test Import
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
