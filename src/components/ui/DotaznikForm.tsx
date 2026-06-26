'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

const PROFESE: { cs: string; de: string }[] = [
  { cs: 'Automechanik',                          de: 'Kfz-Mechaniker' },
  { cs: 'CNC obsluha',                           de: 'CNC-Bediener' },
  { cs: 'Lakýrník',                              de: 'Lackierer' },
  { cs: 'Strojník (bagr)',                       de: 'Baggerführer' },
  { cs: 'Svářeč CO2, MIG, MAG (135)',            de: 'Schweißer CO2, MIG, MAG (135)' },
  { cs: 'Řidič vysokozdvižného vozíku',          de: 'Staplerfahrer' },
  { cs: 'Výrobní linka',                         de: 'Produktionslinie' },
  { cs: 'Zdravotní sestra',                      de: 'Krankenpfleger/in' },
  { cs: 'Brusič',                                de: 'Schleifer' },
  { cs: 'Elektrikář',                            de: 'Elektriker' },
  { cs: 'Skladník',                              de: 'Lagerarbeiter' },
  { cs: 'Svářeč TIG, WIG (141)',                 de: 'Schweißer TIG, WIG (141)' },
  { cs: 'Řidič LKW',                             de: 'LKW-Fahrer' },
  { cs: 'Truhlář',                               de: 'Tischler' },
  { cs: 'Zámečník',                              de: 'Schlosser' },
  { cs: 'nic z výše uvedeného',                  de: 'keines der oben genannten' },
]

interface Props { locale: string }

function AutoRedirect({ locale }: { locale: string }) {
  const [seconds, setSeconds] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          window.location.href = locale === 'de' ? '/de' : '/'
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [locale])

  return (
    <p className="text-xs mt-4" style={{ color: '#9ca3af' }}>
      {locale === 'de'
        ? `Sie werden in ${seconds} Sekunden weitergeleitet...`
        : `Budete přesměrováni za ${seconds} sekund...`}
    </p>
  )
}

export default function DotaznikForm({ locale }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [chceCV, setChceCV] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 })

  useEffect(() => {
    setCaptcha({ a: Math.floor(Math.random() * 10) + 1, b: Math.floor(Math.random() * 10) + 1 })
  }, [])

  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const isDE = locale === 'de'

  const onSubmit = async (data: any) => {
    if (parseInt(captchaAnswer) !== captcha.a + captcha.b) {
      alert(isDE ? 'Captcha falsch!' : 'Špatná odpověď na ověření!')
      return
    }
    setStatus('loading')
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => formData.append(k, val))
        } else {
          formData.append(k, String(v ?? ''))
        }
      })
      if (fotoFile) formData.append('foto', fotoFile)
      if (cvFile) formData.append('cv', cvFile)

      const res = await fetch('/api/dotaznik', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const label = (cs: string, de: string) => isDE ? de : cs

  if (status === 'success') {
    return (
      <div className="mx-auto text-center py-16" style={{ maxWidth: '480px' }}>
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-xl font-medium mb-3" style={{ color: '#2a4f2d' }}>
          {label('Děkujeme za odeslání dotazníku!', 'Vielen Dank für Ihre Bewerbung!')}
        </h2>
        <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
          {label('Ozveme se co nejrychleji.', 'Wir melden uns so schnell wie möglich.')}
        </p>
        <a
          href={locale === 'de' ? '/de' : '/'}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-colors"
          style={{ background: '#2a4f2d', textDecoration: 'none' }}
        >
          {label('← Zpět na hlavní stranu', '← Zurück zur Startseite')}
        </a>
        <AutoRedirect locale={locale} />
      </div>
    )
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700/20"
  const sectionTitle = "text-sm font-semibold mb-4 pb-2 border-b border-gray-100"

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto space-y-8" style={{ maxWidth: '720px' }}>

      {/* OSOBNÍ ÚDAJE */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className={sectionTitle} style={{ color: '#2a4f2d' }}>
          {label('Osobní údaje', 'Persönliche Daten')}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{label('Jméno', 'Vorname')} *</label>
            <input {...register('firstName', { required: true })} className={inputClass} />
            {errors.firstName && <p className="text-xs text-red-500 mt-1">{label('Povinné pole', 'Pflichtfeld')}</p>}
          </div>
          <div>
            <label className="form-label">{label('Příjmení', 'Nachname')} *</label>
            <input {...register('lastName', { required: true })} className={inputClass} />
            {errors.lastName && <p className="text-xs text-red-500 mt-1">{label('Povinné pole', 'Pflichtfeld')}</p>}
          </div>
          <div>
            <label className="form-label">{label('Telefon', 'Telefon')} *</label>
            <input type="tel" {...register('phone', { required: true })} className={inputClass} />
          </div>
          <div>
            <label className="form-label">{label('E-mailová adresa', 'E-Mail-Adresse')} *</label>
            <input type="email" {...register('email', { required: true })} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className="form-label">{label('Ulice a číslo popisné', 'Straße und Hausnummer')} *</label>
            <input {...register('street', { required: true })} className={inputClass} />
          </div>
          <div>
            <label className="form-label">{label('PSČ', 'PLZ')} *</label>
            <input {...register('zip', { required: true })} className={inputClass} />
          </div>
          <div>
            <label className="form-label">{label('Město', 'Stadt')} *</label>
            <input {...register('city', { required: true })} className={inputClass} />
          </div>
          <div>
            <label className="form-label">{label('Datum narození (DD.MM.RRRR)', 'Geburtsdatum (TT.MM.JJJJ)')} *</label>
            <input
              {...register('birthDate', { required: true })}
              className={inputClass}
              placeholder={label('např. 15.03.1990', 'z.B. 15.03.1990')}
            />
          </div>
          <div>
            <label className="form-label">{label('Národnost', 'Nationalität')} *</label>
            <input {...register('nationality', { required: true })} className={inputClass} placeholder={label('česká', 'tschechisch')} />
          </div>
          <div>
            <label className="form-label">{label('Rodinný stav', 'Familienstand')}</label>
            <select {...register('maritalStatus')} className={inputClass}>
              <option value="">{label('Vyberte...', 'Auswählen...')}</option>
              <option value="svobodny">{label('svobodný/á', 'ledig')}</option>
              <option value="zenaty">{label('ženatý/vdaná', 'verheiratet')}</option>
              <option value="rozvedeny">{label('rozvedený/á', 'geschieden')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* FOTOGRAFIE */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className={sectionTitle} style={{ color: '#2a4f2d' }}>
          {label('Fotografie', 'Foto')}
        </h2>
        <div className="space-y-3">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="radio" {...register('fotoChoice')} value="ano" className="accent-green-700" />
              {label('Přikládám fotografii', 'Ich füge ein Foto bei')}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="radio" {...register('fotoChoice')} value="pozdeji" className="accent-green-700" />
              {label('Nemám u sebe, dopošlu co nejrychleji', 'Habe ich nicht dabei, schicke ich nach')}
            </label>
          </div>
          {watch('fotoChoice') === 'ano' && (
            <div>
              <label className="form-label">{label('Vyberte fotografii (JPG, PNG, max. 2 MB)', 'Foto auswählen (JPG, PNG, max. 2 MB)')}</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp"
                onChange={(e) => setFotoFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* POPTÁVANÉ PROFESE */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className={sectionTitle} style={{ color: '#2a4f2d' }}>
          {label('Poptávané profese', 'Gewünschte Berufe')}
        </h2>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {PROFESE.map((p) => (
            <label key={p.cs} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" {...register('profese')} value={p.cs} className="accent-green-700 w-4 h-4" />
              {isDE ? p.de : p.cs}
            </label>
          ))}
        </div>
        <div>
          <label className="form-label">{label('Vámi poptávaná a neuvedená profese', 'Ihr gewünschter, nicht aufgeführter Beruf')}</label>
          <input {...register('profeseJina')} className={inputClass} placeholder={label('Uveďte profesi...', 'Beruf angeben...')} />
        </div>
      </div>

      {/* PRACOVNÍ PODMÍNKY */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className={sectionTitle} style={{ color: '#2a4f2d' }}>
          {label('Pracovní podmínky', 'Arbeitsbedingungen')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="form-label">{label('Kdy můžete nastoupit?', 'Wann können Sie anfangen?')} *</label>
            <input {...register('startDate', { required: true })} className={inputClass} placeholder={label('např. ihned nebo 01.08.2025', 'z.B. sofort oder 01.08.2025')} />
          </div>
          <div>
            <label className="form-label">{label('Znalost německého jazyka', 'Deutschkenntnisse')} *</label>
            <select {...register('german', { required: true })} className={inputClass}>
              <option value="">{label('Vyberte...', 'Auswählen...')}</option>
              <option value="zadna">{label('žádná', 'keine')}</option>
              <option value="zakladni">{label('základní', 'Grundkenntnisse')}</option>
              <option value="pokrocila">{label('pokročilá', 'fortgeschritten')}</option>
              <option value="plynula">{label('plynulá', 'fließend')}</option>
            </select>
          </div>
          <div>
            <label className="form-label">{label('Mám zájem o práci', 'Ich interessiere mich für Arbeit')} *</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input type="radio" {...register('workType', { required: true })} value="pendler" className="accent-green-700" />
                {label('jako pendler (denní dojíždění)', 'als Pendler (tägliches Pendeln)')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input type="radio" {...register('workType')} value="ubytovani" className="accent-green-700" />
                {label('s ubytováním', 'mit Unterkunft')}
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{label('Máte řidičský průkaz?', 'Haben Sie einen Führerschein?')}</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input type="radio" {...register('drivingLicense')} value="ano" className="accent-green-700" />
                  {label('ano', 'ja')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input type="radio" {...register('drivingLicense')} value="ne" className="accent-green-700" />
                  {label('ne', 'nein')}
                </label>
              </div>
            </div>
            <div>
              <label className="form-label">{label('Máte k dispozici automobil?', 'Haben Sie ein Auto?')}</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input type="radio" {...register('hasCar')} value="ano" className="accent-green-700" />
                  {label('ano', 'ja')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input type="radio" {...register('hasCar')} value="ne" className="accent-green-700" />
                  {label('ne', 'nein')}
                </label>
              </div>
            </div>
          <div>
          <label className="form-label">{label('Máte průkaz VZV (vysokozdvižný vozík)?', 'Haben Sie einen Staplerschein?')}</label>
          <div className="flex gap-6">
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
      <input type="radio" {...register('vzvLicense')} value="ano" className="accent-green-700" />
      {label('ano', 'ja')}
    </label>
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
      <input type="radio" {...register('vzvLicense')} value="ne" className="accent-green-700" />
      {label('ne', 'nein')}
    </label>
          </div>
          </div>
          </div>
        </div>
      </div>

      {/* VZDĚLÁNÍ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className={sectionTitle} style={{ color: '#2a4f2d' }}>
          {label('Vzdělání', 'Ausbildung')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="form-label">{label('Základní škola – roky studia, název školy a město', 'Grundschule – Studienjahre, Name und Stadt')}</label>
            <input {...register('primarySchool')} className={inputClass} placeholder={label('např. 2005-2014, ZŠ Klatovy', 'z.B. 2005-2014, Grundschule Klatovy')} />
          </div>
          <div>
            <label className="form-label">{label('Nejvyšší dosažené vzdělání', 'Höchster Bildungsabschluss')}</label>
            <select {...register('education')} className={inputClass}>
              <option value="">{label('Vyberte...', 'Auswählen...')}</option>
              <option value="zakladni">{label('základní', 'Grundschule')}</option>
              <option value="vyceni">{label('vyučení v oboru', 'Berufsausbildung')}</option>
              <option value="stredni">{label('střední škola', 'Gymnasium/Fachoberschule')}</option>
              <option value="vos">{label('vyšší odborná škola', 'Fachschule')}</option>
              <option value="vs">{label('vysoká škola', 'Hochschule/Universität')}</option>
            </select>
          </div>
          <div>
            <label className="form-label">{label('Název školy – roky studia, název, obor', 'Name der Schule – Studienjahre, Name, Fachrichtung')}</label>
            <input {...register('educationDetail')} className={inputClass} placeholder={label('např. 2014-2018, SPŠ Klatovy, strojírenství', 'z.B. 2014-2018, Fachschule Klatovy, Maschinenbau')} />
          </div>
        </div>
      </div>

      {/* PRACOVNÍ ZKUŠENOSTI */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className={sectionTitle} style={{ color: '#2a4f2d' }}>
          {label('Pracovní zkušenosti', 'Berufserfahrung')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="form-label">{label('Poslední zaměstnání', 'Letzte Beschäftigung')}</label>
            <input {...register('job1')} className={inputClass} placeholder={label('např. 06/2018 - 07/2022 - Ahold ČR - pokladní', 'z.B. 06/2018 - 07/2022 - Firma GmbH - Lagermitarbeiter')} />
          </div>
          <div>
            <label className="form-label">{label('Předposlední zaměstnání', 'Vorletzte Beschäftigung')}</label>
            <input {...register('job2')} className={inputClass} placeholder={label('např. 03/2015 - 06/2018 - Sapa s.r.o. - řidič VZV', 'z.B. 03/2015 - 06/2018 - Firma s.r.o. - Staplerfahrer')} />
          </div>
          <div>
            <label className="form-label">{label('2. předposlední zaměstnání', '2. Vorletzte Beschäftigung')}</label>
            <input {...register('job3')} className={inputClass} placeholder={label('např. 03/2013 - 03/2015 - Jetuza a.s. - řidič kamionu', 'z.B. 03/2013 - 03/2015 - Firma a.s. - LKW-Fahrer')} />
          </div>
        </div>
      </div>

      {/* ZPRÁVA */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className={sectionTitle} style={{ color: '#2a4f2d' }}>
          {label('Zpráva', 'Nachricht')}
        </h2>
        <textarea {...register('message')} className={inputClass} rows={4} placeholder={label('Doplňující informace...', 'Zusätzliche Informationen...')} />
      </div>

      {/* ŽIVOTOPIS */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className={sectionTitle} style={{ color: '#2a4f2d' }}>
          {label('Životopis', 'Lebenslauf')}
        </h2>
        <div className="space-y-3">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="radio" name="cvChoice" value="ano" onChange={() => setChceCV(true)} className="accent-green-700" />
              {label('ano, přikládám', 'ja, ich füge ihn bei')}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="radio" name="cvChoice" value="ne" onChange={() => setChceCV(false)} className="accent-green-700" />
              {label('ne', 'nein')}
            </label>
          </div>
          {chceCV && (
            <div>
              <label className="form-label">{label('Vyberte životopis (PDF, DOC, max. 2 MB)', 'Lebenslauf auswählen (PDF, DOC, max. 2 MB)')}</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700"
              />
            </div>
          )}
        </div>
      </div>

      {/* GDPR + CAPTCHA */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" {...register('gdpr', { required: true })} className="mt-0.5 w-4 h-4 cursor-pointer" style={{ accentColor: '#2a4f2d' }} />
          <span className="text-sm text-gray-600 leading-relaxed">
            {label('Souhlasím se ', 'Ich stimme der ')}
            <a href="/privacy" className="underline" style={{ color: '#2a4f2d' }}>
              {label('zpracováním osobních údajů', 'Datenschutzerklärung')}
            </a>
            {label('.', ' zu.')} *
          </span>
        </label>
        {errors.gdpr && <p className="text-xs text-red-500">{label('Povinné pole', 'Pflichtfeld')}</p>}

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 font-medium">{captcha.a} + {captcha.b} =</span>
          <input
            type="number"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-700"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-3 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-colors"
        style={{ background: '#2a4f2d' }}
      >
        {status === 'loading'
          ? label('Odesílám...', 'Wird gesendet...')
          : label('Odeslat formulář', 'Formular absenden')}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-500 text-center">
          {label('Chyba při odesílání. Zkuste to znovu.', 'Fehler beim Senden. Bitte erneut versuchen.')}
        </p>
      )}
    </form>
  )
}
