import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
  console.log('Cleaning up...');
  const { data } = await supabase.from('patients').select('id, name').eq('tenant_id', '11111111-1111-1111-1111-111111111111');
  if (data) {
    const ids = data.filter(p => p.name.includes('Act') || p.name.includes('Test') || p.name.includes('P6') || p.name.includes('Patient') || p.name.includes('Lifecycle') || p.name.includes('Concurrency')).map(p => p.id);
    if (ids.length) {
      console.log('Cleaning', ids.length, 'patients via JS...');
      let err;
      err = (await supabase.from('clinical_records').delete().in('patient_id', ids)).error;
      if (err) console.error('CR err:', err);
      
      const { data: plans } = await supabase.from('treatment_plans').select('id').in('patient_id', ids);
      if (plans && plans.length) {
        await supabase.from('treatment_items').update({ status: 'PLANNED' }).in('treatment_plan_id', plans.map(p => p.id));
        err = (await supabase.from('treatment_items').delete().in('treatment_plan_id', plans.map(p => p.id))).error;
        if (err) console.error('TI err:', err);
      }
      
      err = (await supabase.from('treatment_plans').delete().in('patient_id', ids)).error;
      if (err) console.error('TP err:', err);
      err = (await supabase.from('specialist_referrals').delete().in('patient_id', ids)).error;
      if (err) console.error('SR err:', err);
      err = (await supabase.from('payments').delete().in('patient_id', ids)).error;
      if (err) console.error('PAY err:', err);
      await supabase.from('appointments').update({ status: 'SCHEDULED' }).in('patient_id', ids);
      err = (await supabase.from('appointments').delete().in('patient_id', ids)).error;
      if (err) console.error('APT err:', err);
      err = (await supabase.from('patients').delete().in('id', ids)).error;
      if (err) console.error('PAT err:', err);
      
      console.log('Cleaned', ids.length, 'patients');
    } else {
      console.log('Nothing to clean');
    }
  }
}
run();
