import { NextRequest, NextResponse } from 'next/server'
import { completeVisitAction } from '@/features/clinical/actions/clinicalActions'

export async function POST(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'production' || (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_ROUTES !== 'true')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url)
  const apptId = searchParams.get('apptId')
  if (!apptId) return NextResponse.json({ error: 'Missing apptId' }, { status: 400 })

  try {
    const result = await completeVisitAction(apptId)
    return NextResponse.json(result)
  } catch (err: any) {
    if (err.message === 'NEXT_REDIRECT') {
      return NextResponse.json({ success: true, redirect: true })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
