import { parseTallyRecord, RawTallyRecord } from '../src/features/migration/services/tallyParser';
import { matchPatient } from '../src/features/migration/services/tallyMatcher';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error("Missing Supabase Key");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Synthetic Tally Data for Dry Run
const syntheticTallyRecords: RawTallyRecord[] = [
  { id: 'T001', date: '2023-01-10', ledger_name: 'Dr. Ananya 9999999999', narration: 'Consultation', amount: 500, payment_mode: 'Cash' }, // Won't match exact patient name, but phone will
  { id: 'T002', date: '2023-01-11', ledger_name: 'Tenant One Patient', narration: 'Cash 1111111111', amount: 1500, payment_mode: 'UPI' }, // Phone embedded in narration. Phone match + Name match.
  { id: 'T003', date: '2023-02-15', ledger_name: 'Parent Patient 8888888888', narration: 'Treatment', amount: 2000, payment_mode: 'Cash' }, // Assume phone is shared by Parent/Child
  { id: 'T004', date: '2023-03-01', ledger_name: 'Child Patient', narration: 'Child treatment 8888888888', amount: 1000, payment_mode: 'Card' },
  { id: 'T005', date: '2023-03-10', ledger_name: 'Unknown Patient (Age 45)', narration: 'Walk-in', amount: 300, payment_mode: 'Cash' }, // No phone
  { id: 'T006', date: '2023-04-20', ledger_name: 'Jane Doe', narration: 'Paid 500', amount: 500, payment_mode: 'UPI' }, // No match
];

async function runDryRun() {
  const tenantId = '11111111-1111-1111-1111-111111111111'; // Smile Dental Clinic

  // Pre-seed some dummy patients if they don't exist
  await supabase.from('patients').upsert([
    { id: 'b0000000-0000-0000-0000-000000000001', tenant_id: tenantId, name: 'Dr. Ananya', phone: '9999999999' },
    { id: 'b0000000-0000-0000-0000-000000000002', tenant_id: tenantId, name: 'Tenant One Patient', phone: '1111111111' },
    { id: 'b0000000-0000-0000-0000-000000000003', tenant_id: tenantId, name: 'Parent Patient', phone: '8888888888' },
    { id: 'b0000000-0000-0000-0000-000000000004', tenant_id: tenantId, name: 'Child Patient', phone: '8888888888' }, // Shared phone!
  ]);

  console.log("=== TALLY MIGRATION DRY RUN ===\n");

  let parsedWithPhone = 0;
  let parsedWithoutPhone = 0;
  let parsedWithName = 0;
  let parsedWithAge = 0;

  let autoMatched = 0;
  let manualReview = 0;
  let unmatched = 0;

  for (const record of syntheticTallyRecords) {
    console.log(`Processing Record: ${record.id} | ${record.ledger_name}`);
    const parsed = parseTallyRecord(record);
    
    console.log(`  Parsed -> Name: '${parsed.parsed_name}', Phone: '${parsed.parsed_phone}', Age: '${parsed.historical_age}'`);
    
    if (parsed.parsed_phone) parsedWithPhone++; else parsedWithoutPhone++;
    if (parsed.parsed_name) parsedWithName++;
    if (parsed.historical_age) parsedWithAge++;

    const matchResult = await matchPatient(supabase, tenantId, parsed.parsed_name, parsed.parsed_phone);
    console.log(`  Match Status: ${matchResult.status} | Best Confidence: ${matchResult.best_confidence}`);
    console.log(`  Candidates: ${JSON.stringify(matchResult.candidates.map(c => ({id: c.patient_id, conf: c.confidence, r: c.reasons})))}\n`);

    if (matchResult.status === 'AUTO_MATCHED') autoMatched++;
    if (matchResult.status === 'MANUAL_REVIEW') manualReview++;
    if (matchResult.status === 'UNMATCHED') unmatched++;
  }

  console.log("=== DRY RUN SUMMARY ===");
  console.log(`Total Source Records: ${syntheticTallyRecords.length}`);
  console.log(`Successfully Parsed: ${syntheticTallyRecords.length}`);
  console.log(`Records with Phone: ${parsedWithPhone}`);
  console.log(`Records without Phone: ${parsedWithoutPhone}`);
  console.log(`Records with Name: ${parsedWithName}`);
  console.log(`Records with Age: ${parsedWithAge}`);
  console.log(`\n--- MATCHING RESULTS ---`);
  console.log(`AUTO_MATCHED (High Confidence): ${autoMatched}`);
  console.log(`MANUAL_REVIEW (Ambiguous / Shared Phone / Weak Match): ${manualReview}`);
  console.log(`UNMATCHED (No Patient Found): ${unmatched}`);
}

runDryRun().catch(console.error);
