import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { google } from 'googleapis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = 't.strnad@taros-personal.de'
const MAKE_EMAIL = '97dv7wspqu6l9wifj83imrk5ldfbls7l@hook.eu2.make.com'
const FROM_EMAIL = 'Taros Personal <info@taros-personal.cz>'

async function appendToSheet(data: Record<string, any>, profese: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    const profeseArr = profese.split(',').map(p => p.trim())
    const hleda1 = profeseArr[0] ?? ''
    const hleda2 = profeseArr[1] ?? ''
    const hleda3 = profeseArr.slice(2).join(', ') ?? ''

    const pu = data.workType === 'pendler' ? 'jako pendler (denní dojíždění)' : 's ubytováním'
    const rp = data.drivingLicense === 'ano' ? 'ano' : 'ne'
    const auto = data.hasCar === 'ano' ? 'ano' : 'ne'

    const poznamka = [
      data.message || '',
      data.vzvLicense === 'ano' ? 'Průkaz VZV: ano' : '',
    ].filter(Boolean).join(' | ')

    const row = [
      data.firstName,
      data.lastName,
      data.phone,
      data.email,
      data.street,
      data.city,
      data.birthDate,
      data.nationality,
      data.maritalStatus,
      data.german,
      auto,
      rp,
      data.startDate,
      pu,
      data.primarySchool,
      data.education,
      data.educationDetail,
      data.job1,
      data.job2,
      data.job3,
      hleda1,
      hleda2,
      hleda3,
      poznamka,
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'vsichni!A:X',
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    })
  } catch (err) {
    console.error('Google Sheets error:', err)
  }
}

function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @media print { body { margin:0;padding:0; } .container { box-shadow:none !important; } }
</style>
</head>
<body style="margin:0;padding:20px;background:#f5f5f5;font-family:Arial,sans-serif;font-size:13px;">
  <div class="container" style="max-width:750px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <div style="background:#2a4f2d;padding:12px 32px;">
      <div style="display:inline-flex;align-items:baseline;gap:4px;">
        <span style="color:#ffffff;font-size:24px;font-weight:300;font-family:Georgia,serif;">T</span>
        <span style="color:rgba(255,255,255,0.9);font-size:14px;font-weight:300;letter-spacing:3px;">AROS</span>
        <span style="color:rgba(255,255,255,0.4);font-size:10px;margin-left:8px;">Personalservice GmbH</span>
      </div>
    </div>
    <div style="padding:24px 32px;">
      ${content}
    </div>
  </div>
</body></html>`
}

function emailLayoutSimple(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#2a4f2d;padding:20px 40px;">
            <div style="display:inline-flex;align-items:baseline;gap:4px;">
              <span style="color:#ffffff;font-size:24px;font-weight:300;font-family:Georgia,serif;">T</span>
              <span style="color:rgba(255,255,255,0.9);font-size:14px;font-weight:300;letter-spacing:3px;">AROS</span>
              <span style="color:rgba(255,255,255,0.4);font-size:10px;margin-left:8px;">Personalservice GmbH</span>
            </div>
          </td>
        </tr>
        <tr><td style="padding:40px;">${content}</td></tr>
        <tr>
          <td style="background:#f8f8f8;padding:24px 40px;border-top:1px solid #eeeeee;">
            <p style="margin:0;font-size:12px;color:#999999;text-align:center;">
              Taros Personalservice GmbH &nbsp;|&nbsp; Dr.-Schott-Straße 49, 94227 Zwiesel<br/>
              <a href="mailto:info@taros-personal.de" style="color:#2a4f2d;">info@taros-personal.de</a> &nbsp;|&nbsp;
              <a href="https://taros-personal.cz" style="color:#2a4f2d;">taros-personal.cz</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function row2(label1: string, val1: string | null | undefined, label2: string, val2: string | null | undefined) {
  if (!val1 && !val2) return ''
  return `<tr>
    <td style="padding:4px 8px 4px 0;width:50%;vertical-align:top;">
      <div style="color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">${label1}</div>
      <div style="color:#1a1a1a;font-size:13px;">${val1 || '–'}</div>
    </td>
    <td style="padding:4px 0 4px 8px;width:50%;vertical-align:top;">
      <div style="color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">${label2}</div>
      <div style="color:#1a1a1a;font-size:13px;">${val2 || '–'}</div>
    </td>
  </tr>`
}

function row1(label: string, value: string | null | undefined) {
  if (!value) return ''
  return `<tr>
    <td colspan="2" style="padding:4px 0;">
      <div style="color:#999;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;">${label}</div>
      <div style="color:#1a1a1a;font-size:13px;">${value}</div>
    </td>
  </tr>`
}

function section(title: string, content: string) {
  return `
    <div style="margin-bottom:12px;">
      <div style="background:#2a4f2d;color:#fff;font-size:10px;font-weight:bold;letter-spacing:1px;padding:4px 8px;border-radius:4px;margin-bottom:6px;">${title}</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${content}
      </table>
    </div>`
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const data: Record<string, any> = {}
    const files: Record<string, File> = {}

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files[key] = value
      } else {
        if (data[key]) {
          data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value]
        } else {
          data[key] = value
        }
      }
    }

    const attachments: { filename: string; content: Buffer }[] = []

    if (files.foto && files.foto.size > 0) {
      const buffer = Buffer.from(await files.foto.arrayBuffer())
      const ext = files.foto.name.split('.').pop()
      attachments.push({ filename: `foto-${data.firstName}-${data.lastName}.${ext}`, content: buffer })
    }

    if (files.cv && files.cv.size > 0) {
      const buffer = Buffer.from(await files.cv.arrayBuffer())
      const ext = files.cv.name.split('.').pop()
      attachments.push({ filename: `cv-${data.firstName}-${data.lastName}.${ext}`, content: buffer })
    }

    const profese = Array.isArray(data.profese) ? data.profese.join(', ') : (data.profese ?? '')

    await supabase.from('questionnaires').insert({
      first_name: data.firstName,
      last_name: data.lastName,
      phone: data.phone,
      email: data.email,
      street: data.street,
      zip: data.zip,
      city: data.city,
      birth_date: data.birthDate,
      nationality: data.nationality,
      marital_status: data.maritalStatus,
      profese,
      profese_jina: data.profeseJina,
      start_date: data.startDate,
      german: data.german,
      work_type: data.workType,
      driving_license: data.drivingLicense,
      vzv_license: data.vzvLicense,
      has_car: data.hasCar,
      primary_school: data.primarySchool,
      education: data.education,
      education_detail: data.educationDetail,
      job1: data.job1,
      job2: data.job2,
      job3: data.job3,
      message: data.message,
      status: 'new',
    })

    await appendToSheet(data, profese)

    const workTypeLabel = data.workType === 'pendler' ? 'Pendler (denní dojíždění)' : data.workType === 'ubytovani' ? 'S ubytováním' : '–'
    const educationLabels: Record<string, string> = {
      zakladni: 'Základní', vyceni: 'Vyučení v oboru', stredni: 'Střední škola',
      vos: 'Vyšší odborná škola', vs: 'Vysoká škola',
    }

    const adminHtml = emailLayout(`
      <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:18px;">Nový dotazník od uchazeče</h2>

      ${section('Osobní údaje', `
        ${row2('Jméno', `${data.firstName} ${data.lastName}`, 'Datum narození', data.birthDate)}
        ${row2('E-mail', `<a href="mailto:${data.email}" style="color:#2a4f2d;">${data.email}</a>`, 'Telefon', data.phone)}
        ${row2('Adresa', `${data.street}, ${data.zip} ${data.city}`, 'Národnost / Rodinný stav', `${data.nationality || '–'} / ${data.maritalStatus || '–'}`)}
      `)}

      ${section('Profese a pracovní podmínky', `
        ${row1('Poptávané profese', profese + (data.profeseJina ? ', ' + data.profeseJina : ''))}
        ${row2('Nástup', data.startDate, 'Němčina', data.german)}
        ${row2('Typ práce', workTypeLabel, 'Řidičský průkaz', data.drivingLicense)}
        ${row2('Průkaz VZV', data.vzvLicense, 'Automobil', data.hasCar)}
      `)}

      ${section('Vzdělání', `
        ${row2('Nejvyšší vzdělání', educationLabels[data.education] ?? data.education, 'Základní škola', data.primarySchool)}
        ${row1('Škola / Obor', data.educationDetail)}
      `)}

      ${section('Pracovní zkušenosti', `
        ${row1('Poslední zaměstnání', data.job1)}
        ${row1('Předposlední zaměstnání', data.job2)}
        ${row1('2. předposlední zaměstnání', data.job3)}
      `)}

      ${data.message ? section('Zpráva', row1('', data.message)) : ''}

      ${attachments.length > 0 ? `<p style="color:#999;font-size:11px;margin-top:12px;">📎 Přílohy: ${attachments.map(a => a.filename).join(', ')}</p>` : ''}
    `)

    // Email na admina + Make hook
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [ADMIN_EMAIL, MAKE_EMAIL],
      subject: `Nový dotazník: ${data.firstName} ${data.lastName}`,
      attachments: attachments.length > 0 ? attachments : undefined,
      html: adminHtml,
    })

    // Potvrzovací email uchazeči
    await resend.emails.send({
      from: FROM_EMAIL,
      to: data.email,
      subject: 'Potvrzení přijetí dotazníku – Taros Personalservice',
      html: emailLayoutSimple(`
        <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">Dobrý den, ${data.firstName}!</h2>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px;">
          Váš dotazník byl úspěšně přijat. Děkujeme za zájem o práci v Německu prostřednictvím agentury Taros Personalservice.
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 24px;">
          Náš tým Vaše údaje zpracuje a ozveme se Vám <strong>do 48 hodin</strong>.
        </p>
        <div style="background:#f2f8f1;border-left:3px solid #2a4f2d;padding:16px;margin:0 0 24px;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 8px;color:#2a4f2d;font-size:13px;font-weight:bold;">Co nás čeká:</p>
          <p style="margin:0;color:#374151;font-size:13px;line-height:1.8;">
            ✓ Prostudujeme Vaše zkušenosti a preference<br/>
            ✓ Vyhledáme vhodné pracovní pozice<br/>
            ✓ Kontaktujeme Vás s konkrétní nabídkou
          </p>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
          Komunikujeme česky i německy – bez jazykové bariéry.<br/>
          V případě dotazů nás kontaktujte na <a href="mailto:info@taros-personal.de" style="color:#2a4f2d;">info@taros-personal.de</a>
          nebo telefonicky na <strong>09922 / 869 1234</strong>.
        </p>
        <p style="color:#374151;font-size:14px;margin-top:24px;">S pozdravem,<br/><strong>Tým Taros Personalservice</strong></p>
      `),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
