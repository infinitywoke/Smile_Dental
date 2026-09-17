import { exec } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function runMigrateAsync(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`npx tsx scripts/tally_migrate.ts ${file} --env-override LOCAL --commit`, (error, stdout, stderr) => {
      if (error) reject(error.message + '\n' + stdout + '\n' + stderr);
      else resolve(stdout);
    });
  });
}

async function run() {
  console.log('--- TESTING CONCURRENCY ---');
  await supabase.from('legacy_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const dataset = [];
  for (let i = 0; i < 50; i++) {
    dataset.push({
      id: `T_CONCUR_${i}`,
      date: '2023-01-10',
      ledger_name: `Patient ${i}`,
      narration: `Record ${i}`,
      amount: 100 * i,
      payment_mode: 'Cash'
    });
  }
  
  fs.writeFileSync('temp_concurrent.json', JSON.stringify(dataset));
  
  console.log('Launching Process A and Process B concurrently...');
  
  try {
    const [resA, resB] = await Promise.all([
      runMigrateAsync('temp_concurrent.json'),
      runMigrateAsync('temp_concurrent.json')
    ]);
    
    console.log('Both processes finished without throwing unhandled exceptions.');
    
    // Verify DB count
    const { count, error } = await supabase.from('legacy_records').select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log(`Final Record Count: ${count}`);
    if (count !== 50) {
      throw new Error(`Concurrency test failed. Expected 50 unique records, but found ${count}.`);
    }
    
    console.log('✔ Concurrency test passed. UNIQUE constraint protected data integrity.');
    
  } catch (err) {
    console.error('Concurrency test failed:', err);
  } finally {
    fs.unlinkSync('temp_concurrent.json');
  }
}

run().catch(console.error);
