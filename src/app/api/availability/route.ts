import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Convert IST date to UTC bounds
    const startIST = new Date(`${date}T00:00:00+05:30`).toISOString()
    const endIST = new Date(`${date}T23:59:59+05:30`).toISOString()

    const { data, error } = await supabase
      .from('appointments')
      .select('scheduled_start')
      .gte('scheduled_start', startIST)
      .lte('scheduled_start', endIST)
      .not('status', 'eq', 'cancelled')

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    const bookedSlots = data.map(app => {
      if (!app.scheduled_start) return null;
      // Convert stored UTC to IST time for matching
      const d = new Date(app.scheduled_start);
      // Format as HH:mm in IST
      const localString = d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit', minute: '2-digit' });
      // localString is usually "09:00" or "24:00" etc, adjust for 24h
      return localString;
    }).filter(Boolean)

    return NextResponse.json({ bookedSlots })
  } catch (error) {
    console.error('Availability API error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
