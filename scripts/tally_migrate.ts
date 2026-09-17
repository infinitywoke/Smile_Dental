import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseTallyRecord, RawTallyRecord } from '../src/features/migration/services/tallyParser';
import { matchPatient } from '../src/features/migration/services/tallyMatcher';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function determineEnvironment(): string {
  if (SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1')) {
    return 'LOCAL';
  }
  if (process.env.VERCEL_ENV === 'production' || SUPABASE_URL.includes('supabase.co')) {
    // Basic heuristic for production
    if (process.env.CLINIC_OS_ENV === 'staging') return 'STAGING';
    return 'PRODUCTION';
  }
  return 'UNKNOWN';
}

async function run() {
  const args = process.argv.slice(2);
  let file = '';
  let mode = 'DRY_RUN'; // Safe default
  let confirmation = '';
  let tenantId = '11111111-1111-1111-1111-111111111111'; // Default tenant for demo
  let overrideEnv = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--commit') {
      mode = 'COMMIT';
    } else if (args[i] === '--confirm') {
      confirmation = args[++i];
    } else if (args[i] === '--tenant') {
      tenantId = args[++i];
    } else if (args[i] === '--env-override') {
      overrideEnv = args[++i];
    } else if (!args[i].startsWith('--')) {
      file = args[i];
    }
  }

  const env = overrideEnv || determineEnvironment();

  console.log('=========================================');
  console.log('       TALLY MIGRATION TOOL');
  console.log('=========================================');
  console.log(`TARGET ENVIRONMENT : ${env}`);
  console.log(`MODE               : ${mode}`);
  console.log(`FILE               : ${file || 'Synthetic Dataset'}`);
  console.log('=========================================\n');

  if (mode === 'COMMIT' && env === 'PRODUCTION') {
    if (confirmation !== 'IMPORT PRODUCTION TALLY DATA') {
      console.error('ERROR: Production import rejected.');
      console.error('To execute a production migration, you must pass the exact confirmation phrase:');
      console.error('  --confirm "IMPORT PRODUCTION TALLY DATA"');
      process.exit(1);
    }
    console.log('PRODUCTION CONFIRMATION RECEIVED. PROCEEDING WITH COMMIT...');
  }

  // Load dataset
  let records: RawTallyRecord[] = [];
  if (file) {
    try {
      const content = fs.readFileSync(path.resolve(file), 'utf-8');
      records = JSON.parse(content);
    } catch (e: any) {
      console.error(`Failed to load file: ${e.message}`);
      process.exit(1);
    }
  } else {
    // Synthetic dataset
    records = [
      { id: 'T001', date: '2023-01-10', ledger_name: 'Dr. Ananya 9999999999', narration: 'Consultation', amount: 500, payment_mode: 'Cash' },
      { id: 'T002', date: '2023-01-11', ledger_name: 'Tenant One Patient', narration: 'Cash 1111111111', amount: 1500, payment_mode: 'UPI' },
      { id: 'T003', date: '2023-02-15', ledger_name: 'Parent Patient 8888888888', narration: 'Treatment', amount: 2000, payment_mode: 'Cash' },
    ];
  }

  console.log(`Loaded ${records.length} records.`);

  if (mode === 'DRY_RUN') {
    console.log('\n--- EXECUTING DRY RUN ---');
    let auto = 0, manual = 0, unmatched = 0;
    for (const record of records) {
      const parsed = parseTallyRecord(record);
      const matchResult = await matchPatient(supabase, tenantId, parsed.parsed_name, parsed.parsed_phone);
      if (matchResult.status === 'AUTO_MATCHED') auto++;
      if (matchResult.status === 'MANUAL_REVIEW') manual++;
      if (matchResult.status === 'UNMATCHED') unmatched++;
    }
    console.log(`AUTO_MATCHED: ${auto} | MANUAL_REVIEW: ${manual} | UNMATCHED: ${unmatched}`);
    console.log('\nDRY RUN COMPLETE. No data was committed.');
    return;
  }

  // COMMIT MODE
  console.log('\n--- EXECUTING COMMIT ---');
  
  // Create Batch
  const { data: batch, error: batchError } = await supabase.from('import_batches').insert({
    tenant_id: tenantId,
    source_system: 'TALLY',
    filename: file || 'synthetic',
    status: 'PROCESSING',
    record_count: records.length,
  }).select().single();

  if (batchError || !batch) {
    console.error('Failed to create batch:', batchError);
    process.exit(1);
  }

  console.log(`Created Import Batch: ${batch.id}`);

  let errors = 0;
  let processed = 0;

  for (const raw of records) {
    try {
      const parsed = parseTallyRecord(raw);
      const matchResult = await matchPatient(supabase, tenantId, parsed.parsed_name, parsed.parsed_phone);
      
      // Check if record exists
      const { data: existingRecord } = await supabase.from('legacy_records')
        .select('id, import_batch_id')
        .eq('tenant_id', tenantId)
        .eq('source_system', 'TALLY')
        .eq('source_record_id', raw.id)
        .single();

      let legacyRecordId = existingRecord?.id;
      const action = existingRecord ? 'UPDATE' : 'INSERT';

      const payload = {
        tenant_id: tenantId,
        source_system: 'TALLY',
        source_record_id: raw.id,
        transaction_date: raw.date,
        raw_patient_identifier: raw.ledger_name,
        raw_narration: raw.narration,
        raw_amount: raw.amount,
        raw_payment_mode: raw.payment_mode,
        // Only set import_batch_id if inserting
        ...(action === 'INSERT' ? { import_batch_id: batch.id } : {}),
        parsed_name: parsed.parsed_name,
        parsed_phone: parsed.parsed_phone,
        parsed_address: parsed.parsed_address,
        historical_age: parsed.historical_age,
        match_status: matchResult.status,
        match_confidence: matchResult.best_confidence,
        candidate_patients: JSON.stringify(matchResult.candidates),
        patient_id: matchResult.status === 'AUTO_MATCHED' ? matchResult.candidates[0].patient_id : null
      };

      let dbError;
      if (action === 'INSERT') {
        const { data: newRec, error: insertError } = await supabase.from('legacy_records').insert(payload).select('id').single();
        dbError = insertError;
        if (newRec) legacyRecordId = newRec.id;
      } else {
        const { error: updateError } = await supabase.from('legacy_records').update(payload).eq('id', legacyRecordId);
        dbError = updateError;
      }

      if (dbError) {
        console.error(`Error inserting/updating ${raw.id}:`, dbError.message);
        errors++;
      } else {
        // Insert audit trail
        await supabase.from('import_batch_records').insert({
          import_batch_id: batch.id,
          legacy_record_id: legacyRecordId,
          action: action
        });
        processed++;
      }
    } catch (e: any) {
      console.error(`Error processing ${raw.id}:`, e.message);
      errors++;
    }
  }

  await supabase.from('import_batches').update({
    status: 'COMPLETED',
    error_count: errors
  }).eq('id', batch.id);

  console.log(`\nCOMMIT COMPLETE.`);
  console.log(`Batch ID: ${batch.id}`);
  console.log(`Processed: ${processed}`);
  console.log(`Errors: ${errors}`);
}

run().catch(console.error);
