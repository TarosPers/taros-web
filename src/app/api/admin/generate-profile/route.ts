import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const TEMPLATE_FIELDS = [
  'bewerbung_als', 'ansprechpartner', 'telefon', 'eintritt', 'mobilitaet', 'sprachen',
  'nachname', 'vorname', 'geburtsdatum', 'plz_ort', 'nationalitaet', 'familienstand',
  'schule_von_bis', 'schule_name', 'schule_abschluss',
  'ausbildung_von_bis', 'ausbildung_firma', 'ausbildung_als',
  'job1_von_bis', 'job1_firma', 'job1_taetigkeit',
  'job2_von_bis', 'job2_firma', 'job2_taetigkeit',
  'job3_von_bis', 'job3_firma', 'job3_taetigkeit',
] as const

// Pevné předvyplněné texty - vždy se připojí před hodnotu z dotazníku
const FIXED_PREFIXES: Partial<Record<(typeof TEMPLATE_FIELDS)[number], string>> = {
  schule_name: 'Grundschule',
  schule_abschluss: 'Mittelschulabschluss',
  ausbildung_firma: 'Berufschule',
}

function withFixedPrefix(key: string, value: string): string {
  const prefix = FIXED_PREFIXES[key as keyof typeof FIXED_PREFIXES]
  if (!prefix) return value
  return value ? `${prefix} ${value}` : prefix
}

export async function POST(req: NextRequest) {
  try {
    // Ověření, že požadavek přišel od přihlášeného admina
    const authHeader = req.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const fields = body.fields ?? {}

    // Sestavit data pro šablonu - chybějící pole = prázdný text, žádná pole nejsou povinná
    const templateData: Record<string, string> = {}
    for (const key of TEMPLATE_FIELDS) {
      const rawValue = typeof fields[key] === 'string' ? fields[key] : ''
      templateData[key] = withFixedPrefix(key, rawValue)
    }

    const templateUrl = new URL('/templates/qualifikationsprofil-template.docx', req.url)
    const templateRes = await fetch(templateUrl)
    if (!templateRes.ok) {
      return NextResponse.json({ error: 'Šablona nenalezena' }, { status: 500 })
    }
    const arrayBuffer = await templateRes.arrayBuffer()
    const zip = new PizZip(Buffer.from(arrayBuffer))
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    })

    doc.render(templateData)

    const buf = doc.getZip().generate({ type: 'nodebuffer' })
    const safeName = `${templateData.nachname}_${templateData.vorname}`.trim().replace(/\s+/g, '_') || 'profil'
    const filename = `Qualifikationsprofil_${safeName}.docx`

    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Chyba při generování dokumentu' }, { status: 500 })
  }
}