import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createTreatmentPlan, createTreatmentItem, updateTreatmentItemStatus } from '@/features/treatments/actions/treatmentActions';

export async function POST(req: NextRequest) {
  // Reject execution in production unless explicitly enabled via internal test flag
  if (process.env.VERCEL_ENV === 'production' || (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ROUTES !== 'true')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch caller's tenant
  const { data: userProfile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userProfile?.tenant_id) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'seedTreatment') {
      // Verify patient belongs to user's tenant
      const { data: patient } = await supabase
        .from('patients')
        .select('tenant_id')
        .eq('id', payload.patientId)
        .single();

      if (!patient || patient.tenant_id !== userProfile.tenant_id) {
        return NextResponse.json({ error: 'Cross-tenant access forbidden' }, { status: 403 });
      }

      const planRes = await createTreatmentPlan(payload.patientId, payload.planName || 'Test Plan');
      if (planRes.error) return NextResponse.json(planRes);
      
      const itemRes = await createTreatmentItem(planRes.data!.id, payload.patientId, payload.procedure || 'Test Procedure', '1', 500, '');
      if (itemRes.error) return NextResponse.json(itemRes);
      
      if (payload.status) {
        await updateTreatmentItemStatus(itemRes.data!.id, planRes.data!.id, payload.patientId, payload.status);
      }
      
      return NextResponse.json({ success: true, plan: planRes.data, item: itemRes.data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
