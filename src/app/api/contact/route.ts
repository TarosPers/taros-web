import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

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
          <td style="background:#2a4f2d;padding:28px 40px;text-align:center;">
            <div style="color:#ffffff;font-size:28px;font-weight:300;letter-spacing:4px;">TAROS</div>
            <div style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:2px;margin-top:2px;">PERSONALSERVICE GMBH</div>
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
    const body = await req.json()
    const { firstName, lastName, email, subject, message } = body

    // Email adminovi
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAILS,
      subject: `Kontaktní formulář: ${subject}`,
      html: emailLayout(`
        <h2 style="margin:0 0 24px;color:#1a1a1a;font-size:22px;">Nová zpráva z webu</h2>
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
            <span style="color:#999;font-size:12px;">Předmět</span><br/>
            <span style="color:#1a1a1a;font-size:14px;">${subject}</span>
          </td></tr>
          <tr><td style="padding:8px 0;">
            <span style="color:#999;font-size:12px;">Zpráva</span><br/>
            <span style="color:#1a1a1a;font-size:14px;line-height:1.6;">${message}</span>
          </td></tr>
        </table>
        <div style="margin-top:24px;">
          <a href="mailto:${email}" style="background:#2a4f2d;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:13px;">✉️ Odpovědět</a>
        </div>
      `),
    })

    // Potvrzení odesílateli
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Vaše zpráva byla přijata – Taros Personalservice',
      html: emailLayout(`
        <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">Dobrý den, ${firstName}!</h2>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
          Obdrželi jsme Vaši zprávu a brzy se Vám ozveme.
        </p>
        <div style="background:#f2f8f1;border-left:3px solid #2a4f2d;padding:16px;margin:24px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 4px;color:#999;font-size:12px;">Váš předmět:</p>
          <p style="margin:0;color:#2a4f2d;font-size:14px;font-weight:bold;">${subject}</p>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
          Komunikujeme česky i německy – bez jazykové bariéry.<br/>
          V případě dotazů nás kontaktujte na <a href="mailto:info@taros-personal.de" style="color:#2a4f2d;">info@taros-personal.de</a>
        </p>
        <p style="color:#374151;font-size:14px;">S pozdravem,<br/><strong>Tým Taros Personalservice</strong></p>
      `),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}