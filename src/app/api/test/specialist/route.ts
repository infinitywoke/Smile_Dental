import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { recordPayment } from '@/features/payments/actions/paymentActions';
import { createAppointment } from '@/features/appointments/actions/appointmentActions';
import { createSpecialistReferral } from '@/features/treatments/actions/specialistReferralActions';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'createSpecialistReferral') {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, String(value));
      });
      try {
        const result = await createSpecialistReferral(formData);
        return NextResponse.json(result || { success: true });
      } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT' || e.digest?.startsWith('NEXT_REDIRECT')) {
          return NextResponse.json({ success: true, redirected: true });
        }
        return NextResponse.json({ error: e.message || 'Unknown error' });
      }
    }

    if (action === 'queryReferral') {
      const { data } = await supabase.from('specialist_referrals').select('*').eq('id', payload.id).single();
      return NextResponse.json({ data });
    }
    
    if (action === 'queryLatestReferral') {
      const { data } = await supabase.from('specialist_referrals').select('*').eq('patient_id', payload.patientId).order('created_at', { ascending: false }).limit(1).single();
      return NextResponse.json({ data });
    }

    if (action === 'recordPayment') {
      const result = await recordPayment(
        payload.patientId,
        payload.amount,
        payload.paymentDate,
        payload.paymentMode,
        payload.treatmentPlanId,
        payload.treatmentItemId,
        payload.reference,
        payload.specialistReferralId
      );
      return NextResponse.json(result);
    }

    if (action === 'createAppointment') {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value) formData.append(key, String(value));
      });
      try {
        const result = await createAppointment(formData);
        return NextResponse.json(result || { success: true });
      } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT' || e.digest?.startsWith('NEXT_REDIRECT')) {
          return NextResponse.json({ success: true, redirected: true });
        }
        return NextResponse.json({ error: e.message || 'Unknown error' });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
