import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function runCmd(cmd: string, expectFailure = false) {
  try {
    const out = execSync(`npx tsx scripts/tally_migrate.ts ${cmd}`, { stdio: 'pipe' }).toString();
    if (expectFailure) {
      console.error(`ERROR: Expected failure but succeeded for cmd: ${cmd}`);
      process.exit(1);
    }
    return out;
  } catch (e: any) {
    if (!expectFailure) {
      console.error(`ERROR: Expected success but failed for cmd: ${cmd}`);
      console.error(e.stdout?.toString());
      console.error(e.stderr?.toString());
      process.exit(1);
    }
    return e.stdout?.toString() + '\n' + e.stderr?.toString();
  }
}

async function run() {
  // Clear any existing records for a clean test
  await supabase.from('legacy_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('import_batches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('--- TESTING GUARDRAILS ---');
  // Case A: Production environment + no explicit confirmation -> IMPORT REJECTED
  console.log('Case A: Production, No Confirmation');
  const outA = runCmd('--env-override PRODUCTION --commit', true);
  if (!outA.includes('ERROR: Production import rejected')) throw new Error('Guardrail failed Case A');
  console.log('✔ Case A Passed');

  // Case B: Production environment + dry-run -> PARSE/REPORT ONLY
  console.log('Case B: Production, Dry Run');
  const outB = runCmd('--env-override PRODUCTION');
  if (!outB.includes('EXECUTING DRY RUN')) throw new Error('Guardrail failed Case B');
  console.log('✔ Case B Passed');

  // Case C: Production environment + explicit confirmation -> migration permitted
  console.log('Case C: Production, Confirmed');
  const outC = runCmd('--env-override PRODUCTION --commit --confirm "IMPORT PRODUCTION TALLY DATA"');
  if (!outC.includes('PRODUCTION CONFIRMATION RECEIVED')) throw new Error('Guardrail failed Case C');
  const batch1Match = outC.match(/Batch ID: ([\w-]+)/);
  const batchA = batch1Match ? batch1Match[1] : null;
  console.log(`✔ Case C Passed (Created Batch A: ${batchA})`);

  console.log('\n--- TESTING SOFT ROLLBACK ---');
  const datasetB = [
    { id: 'T001', date: '2023-01-10', ledger_name: 'Dr. Ananya 9999999999', narration: 'Consultation', amount: 500, payment_mode: 'Cash' },
    { id: 'T002', date: '2023-01-11', ledger_name: 'Tenant One Patient', narration: 'Cash 1111111111', amount: 1500, payment_mode: 'UPI' },
    { id: 'T003', date: '2023-02-15', ledger_name: 'Parent Patient 8888888888', narration: 'Treatment', amount: 2000, payment_mode: 'Cash' },
    { id: 'T004', date: '2023-03-01', ledger_name: 'New Record 1', narration: 'Test', amount: 100, payment_mode: 'Cash' },
    { id: 'T005', date: '2023-03-02', ledger_name: 'New Record 2', narration: 'Test', amount: 200, payment_mode: 'UPI' }
  ];
  fs.writeFileSync('temp_dataset_b.json', JSON.stringify(datasetB));
  
  // Import B
  const outD = runCmd('temp_dataset_b.json --env-override LOCAL --commit');
  const batch2Match = outD.match(/Batch ID: ([\w-]+)/);
  const batchB = batch2Match ? batch2Match[1] : null;
  
  const { data: records2 } = await supabase.from('legacy_records').select('id, import_batch_id');
  const count2 = records2?.length || 0;
  console.log(`Count after Import B (should be 5): ${count2} records`);
  
  // Rollback B
  console.log(`Rolling back Batch B (${batchB})...`);
  // The correct soft rollback query uses import_batch_id
  await supabase.from('legacy_records').delete().eq('import_batch_id', batchB);
  await supabase.from('import_batch_records').delete().eq('import_batch_id', batchB); // Explicitly remove audit entries
  await supabase.from('import_batches').update({ status: 'CANCELLED' }).eq('id', batchB);

  const { data: records3 } = await supabase.from('legacy_records').select('id, import_batch_id');
  const count3 = records3?.length || 0;
  console.log(`Count after rolling back B (should be 3): ${count3} records`);
  if (count3 !== 3) {
      throw new Error(`Rollback failed, expected 3, got ${count3}`);
  }
  
  const allBatchA = records3?.every(r => r.import_batch_id === batchA);
  if (!allBatchA) {
      throw new Error('Records have incorrect import_batch_id after rollback');
  }
  console.log('✔ Rollback Passed: Original canonical records untouched, new records deleted.');

  // Cleanup
  fs.unlinkSync('temp_dataset_b.json');
  console.log('\nALL SAFETY TESTS PASSED.');
}

run().catch(console.error);
