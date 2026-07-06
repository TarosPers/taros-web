import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

const ADMIN_EMAILS = ['t.strnad@taros-personal.de', 't.wagner@taros-personal.de', 'j.simsa@taros-personal.de']
const FROM_EMAIL = 'Taros Personal <info@taros-personal.cz>'

function emailLayout(content: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#ffffff;padding:28px 40px;text-align:center;border-bottom:1px solid #eeeeee;">
            <img src="https://www.taros-personal.cz/images/logo.png" alt="Taros Personalservice" style="height:40px;display:block;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const jobId = formData.get('jobId') as string
    const jobTitle = formData.get('jobTitle') as string
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const cvFile = formData.get('cv') as File | null

    // Upload CV
    let cvUrl = null
    if (cvFile && cvFile.size > 0) {
      const buffer = Buffer.from(await cvFile.arrayBuffer())
      const filename = `cvs/${Date.now()}-${cvFile.name}`
      const { error } = await supabase.storage.from('job-images').upload(filename, buffer, { contentType: cvFile.type })
      if (!error) {
        const { data } = supabase.storage.from('job-images').getPublicUrl(filename)
        cvUrl = data.publicUrl
      }
    }

    // Uložit do DB
    await supabase.from('applicants').insert({
      job_id: jobId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      message,
      cv_url: cvUrl,
      status: 'new',
    })

    // Email adminovi
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAILS,
      subject: `Nová přihláška: ${subject}`,
      html: emailLayout(`
        <h2 style="margin:0 0 4px;color:#1a1a1a;font-size:22px;">Nová přihláška na pozici</h2>
        <p style="margin:0 0 24px;color:#e07b0a;font-size:14px;font-weight:bold;">${subject}</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
            <span style="color:#999;font-size:12px;">Jméno</span><br/>
            <span style="color:#1a1a1a;font-size:14px;">${firstName} ${lastName}</span>
          </td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
            <span style="color:#999;font-size:12px;">E-mail</span><br/>
            <a href="mailto:${email}" style="color:#2a4f2d;font-size:14px;">${email}</a>
          </td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
            <span style="color:#999;font-size:12px;">Telefon</span><br/>
            <span style="color:#1a1a1a;font-size:14px;">${phone || '–'}</span>
          </td></tr>
          ${message ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">
            <span style="color:#999;font-size:12px;">Zpráva</span><br/>
            <span style="color:#1a1a1a;font-size:14px;">${message}</span>
          </td></tr>` : ''}
          ${cvUrl ? `<tr><td style="padding:12px 0;">
            <a href="${cvUrl}" style="background:#2a4f2d;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;">📄 Stáhnout životopis</a>
          </td></tr>` : ''}
        </table>
      `),
    })

    // Potvrzení uchazeči
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Potvrzení přihlášky – ${jobTitle}`,
      html: emailLayout(`
        <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">Dobrý den, ${firstName}!</h2>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
          Vaše přihláška na pozici <strong style="color:#2a4f2d;">${jobTitle}</strong> byla úspěšně přijata.
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
          Náš tým Vaši přihlášku zpracuje a ozveme se Vám <strong>do 48 hodin</strong>.
        </p>
        <div style="background:#f2f8f1;border-left:3px solid #2a4f2d;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#2a4f2d;font-size:13px;">
            Komunikujeme česky i německy – bez jazykové bariéry.<br/>
            V případě dotazů nás kontaktujte na <a href="mailto:info@taros-personal.de" style="color:#2a4f2d;">info@taros-personal.de</a>
          </p>
        </div>
        <p style="color:#374151;font-size:14px;">S pozdravem,<br/><strong>Tým Taros Personalservice</strong></p>
      `),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
