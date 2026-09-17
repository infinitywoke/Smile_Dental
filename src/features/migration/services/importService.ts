import { createClient } from '@/utils/supabase/server'
import { RawTallyRecord, parseTallyRecord } from './tallyParser'
import { matchPatient } from './tallyMatcher'

export async function processTallyImport(records: RawTallyRecord[], filename: string = 'api_import') {
  const supabase = await createClient()
  
  // 1. Get current tenant
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: userProfile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
  if (!userProfile) throw new Error('User profile not found')
  const tenantId = userProfile.tenant_id

  // 2. Create Import Batch
  const { data: batch, error: batchError } = await supabase.from('import_batches').insert({
    tenant_id: tenantId,
    source_system: 'TALLY',
    filename,
    status: 'PROCESSING',
    record_count: records.length,
    created_by: user.id
  }).select().single()

  if (batchError || !batch) throw new Error('Failed to create import batch')

  let errorCount = 0

  // 3. Process each record (raw-first, then parse/match)
  for (const raw of records) {
    try {
      // Parse
      const parsed = parseTallyRecord(raw)
      
      // Match
      const matchResult = await matchPatient(supabase, tenantId, parsed.parsed_name, parsed.parsed_phone)
      
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
        console.error('Upsert error:', dbError)
        errorCount++
      } else {
        // Insert audit trail
        await supabase.from('import_batch_records').insert({
          import_batch_id: batch.id,
          legacy_record_id: legacyRecordId,
          action: action
        });
      }
    } catch (e) {
      console.error('Record processing error:', e)
      errorCount++
    }
  }

  // 4. Update Batch
  await supabase.from('import_batches').update({
    status: errorCount > 0 ? 'COMPLETED' : 'COMPLETED', // Or FAILED if all failed
    error_count: errorCount
  }).eq('id', batch.id)

  return { batchId: batch.id, processed: records.length, errors: errorCount }
}
