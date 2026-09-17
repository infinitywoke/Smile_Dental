import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'csv'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
  if (!userData?.tenant_id) return new NextResponse('No tenant found', { status: 403 })

  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .eq('tenant_id', userData.tenant_id)
    .order('name')

  if (error || !patients) return new NextResponse('Error fetching patients', { status: 500 })

  if (format === 'json') {
    return new NextResponse(JSON.stringify(patients, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=patients.json'
      }
    })
  }

  if (format === 'xml') {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<patients>\n'
    patients.forEach((p: any) => {
      xml += '  <patient>\n'
      xml += '    <id>' + (p.id || '') + '</id>\n'
      xml += '    <name>' + (p.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</name>\n'
      xml += '    <phone>' + (p.phone || '') + '</phone>\n'
      xml += '    <dob>' + (p.date_of_birth || '') + '</dob>\n'
      xml += '  </patient>\n'
    })
    xml += '</patients>'
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': 'attachment; filename=patients.xml'
      }
    })
  }

  const headers = ['id', 'name', 'phone', 'date_of_birth', 'created_at']
  let csv = headers.join(',') + '\n'
  patients.forEach((p: any) => {
    const row = [
      p.id,
      " + (p.name || '').replace(/"/g, '""') + ",
      " + (p.phone || '') + ",
      p.date_of_birth || '',
      p.created_at || ''
    ]
    csv += row.join(',') + '\n'
  })
  
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=patients.csv'
    }
  })
}
