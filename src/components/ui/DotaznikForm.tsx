'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'

// ─── SEZNAM PROFESÍ ────────────────────────────────────────────────────────
const PROFESE_KATEGORIE: { cs: string; pozice: string[] }[] = [
  {
    cs: 'Výroba a průmysl',
    pozice: [
      'Pomocný pracovník ve výrobě','Operátor výroby','Dělník ve výrobě',
      'Montážní pracovník','Pracovník kompletace','Pracovník dokončovací výroby',
      'Obsluha výrobní linky','Obsluha stroje','Seřizovač strojů','Strojní operátor',
      'Kontrolor kvality','Pracovník výstupní kontroly','Pracovník balení','Balič / balička',
      'Třídič výrobků','Pracovník lisovny','Obsluha vstřikolisu','Obsluha CNC',
      'CNC operátor','CNC seřizovač','Pracovník plastikářské výroby',
      'Pracovník automobilového průmyslu','Montážník autodílů',
      'Pracovník potravinářské výroby','Pracovník textilní výroby',
      'Pracovník dřevozpracující výroby',
    ],
  },
  {
    cs: 'Sklady a logistika',
    pozice: [
      'Skladník','Pomocný skladník','Řidič VZV','Řidič retraku','Komisionář',
      'Picker / pracovník vychystávání','Pracovník expedice','Pracovník příjmu zboží',
      'Pracovník balení zásilek','Třídič zásilek','Manipulant','Nakladač / vykladač',
      'Inventurní pracovník','Logistik','Disponent dopravy','Vedoucí skladu',
      'Koordinátor logistiky','Operátor skladu',
    ],
  },
  {
    cs: 'Kovovýroba a strojírenství',
    pozice: [
      'Svářeč MIG/MAG','Svářeč TIG/WIG','Svářeč elektrodou','Zámečník',
      'Strojní zámečník','Průmyslový zámečník','Montážní zámečník','Kovodělník',
      'Obráběč kovů','Soustružník','Frézař','Brusič kovů','Nástrojař','Klempíř',
      'Potrubář','Montér ocelových konstrukcí','Obsluha ohraňovacího lisu',
      'Obsluha laserového řezacího stroje','Pracovník povrchových úprav',
      'Lakýrník kovů','Pískovač','Slévač','Pracovník slévárny','Konstruktér',
      'Technik výroby','Mistr výroby',
    ],
  },
  {
    cs: 'Elektrotechnika',
    pozice: [
      'Elektrikář','Průmyslový elektrikář','Stavební elektrikář','Elektromontér',
      'Elektrotechnik','Elektromechanik','Mechatronik','Servisní technik',
      'Technik údržby','Technik automatizace','Programátor PLC','Montér rozvaděčů',
      'Elektrokonstruktér','Technik měření a regulace','Instalatér fotovoltaiky',
      'Technik fotovoltaických systémů','Montér kabelových tras',
    ],
  },
  {
    cs: 'Automobilový průmysl',
    pozice: [
      'Automechanik','Autoelektrikář','Autolakýrník','Autoklempíř','Karosář',
      'Mechanik nákladních vozidel','Mechanik autobusů','Pneuservisní pracovník',
      'Montážník automobilů','Kontrolor automobilových dílů',
      'Pracovník výroby autosedaček','Pracovník lakovny',
      'Obsluha robotické linky','Diagnostik vozidel',
    ],
  },
  {
    cs: 'Stavebnictví',
    pozice: [
      'Zedník','Pomocný stavební dělník','Tesař','Pokrývač','Klempíř','Instalatér',
      'Topenář','Obkladač','Sádrokartonář','Malíř / natěrač','Fasádník','Lešenář',
      'Betonář','Železář','Izolatér','Podlahář','Montér oken a dveří',
      'Montér vzduchotechniky','Montér suchých staveb','Stavební elektrikář',
      'Bagrista','Jeřábník','Obsluha stavebních strojů','Stavbyvedoucí',
      'Stavební technik','Rozpočtář staveb',
    ],
  },
  {
    cs: 'Doprava',
    pozice: [
      'Řidič kamionu C+E','Řidič nákladního vozidla C','Řidič dodávky','Kurýr',
      'Řidič autobusu','Řidič MHD','Řidič osobní dopravy','Řidič cisterny',
      'Řidič stavebních vozidel','Řidič odtahového vozidla','Řidič popelářského vozu',
      'Řidič zemědělských strojů','Dispečer dopravy','Speditér',
    ],
  },
  {
    cs: 'Hotely a gastronomie',
    pozice: [
      'Kuchař','Pomocný kuchař','Šéfkuchař','Pekař','Cukrář','Číšník / servírka',
      'Barman','Barista','Pomocná síla do kuchyně','Myč nádobí','Pokojská',
      'Hotelový pracovník','Recepční','Pracovník snídaňového servisu',
      'Pracovník hotelového úklidu','Vedoucí restaurace','Hotelový manažer',
      'Pracovník cateringu',
    ],
  },
  {
    cs: 'Úklid a facility management',
    pozice: [
      'Uklízeč / uklízečka','Pracovník průmyslového úklidu','Pracovník úklidu kanceláří',
      'Pracovník úklidu hotelů','Pracovník úklidu nemocnic','Čistič strojů',
      'Čistič výrobních hal','Správce budovy','Údržbář','Domovník',
      'Pracovník technické správy budov','Pracovník prádelny',
    ],
  },
  {
    cs: 'Zdravotnictví a sociální péče',
    pozice: [
      'Zdravotní sestra','Praktická sestra','Pečovatel / pečovatelka','Ošetřovatel',
      'Sanitář','Fyzioterapeut','Ergoterapeut','Lékař','Zubní lékař','Zubní asistent',
      'Laborant','Farmaceut','Pracovník domova seniorů','Sociální pracovník',
      'Osobní asistent',
    ],
  },
  {
    cs: 'Zemědělství a lesnictví',
    pozice: [
      'Zemědělský pracovník','Pomocník na farmě','Pracovník živočišné výroby',
      'Ošetřovatel zvířat','Dojič','Traktorista','Obsluha zemědělských strojů',
      'Pracovník sklizně','Sběrač ovoce a zeleniny','Zahradník','Pracovník skleníku',
      'Lesní dělník','Dřevorubec','Obsluha lesních strojů','Pracovník pily',
    ],
  },
  {
    cs: 'Dřevozpracující a nábytkářský průmysl',
    pozice: [
      'Truhlář','Stolař','Nábytkář','Montážník nábytku',
      'Obsluha dřevoobráběcích strojů','Obsluha CNC na dřevo','Pracovník pily',
      'Pracovník výroby oken','Pracovník výroby dveří','Brusič dřeva',
      'Lakýrník nábytku','Čalouník','Pracovník výroby kuchyní',
    ],
  },
  {
    cs: 'Potravinářství',
    pozice: [
      'Pracovník potravinářské výroby','Řezník','Uzenář','Bourač masa',
      'Pracovník masokombinátu','Pekař','Cukrář','Pracovník mlékárny',
      'Pracovník výroby nápojů','Obsluha balicí linky','Kontrolor kvality potravin',
      'Pracovník mrazírny','Pracovník třídění potravin',
    ],
  },
  {
    cs: 'Administrativa a kancelář',
    pozice: [
      'Administrativní pracovník','Asistent / asistentka','Recepční','Fakturant',
      'Účetní','Mzdová účetní','Personalista','Náborář','HR specialista',
      'Obchodní referent','Referent zákaznického servisu','Pracovník zákaznické podpory',
      'Nákupčí','Disponent','Plánovač výroby','Koordinátor zakázek','Vedoucí kanceláře',
    ],
  },
  {
    cs: 'IT a technické profese',
    pozice: [
      'Programátor','Webový vývojář','Frontend developer','Backend developer',
      'Full-stack developer','IT administrátor','Správce sítí','IT technik',
      'Specialista kybernetické bezpečnosti','Datový analytik','Softwarový tester',
      'DevOps engineer','Cloud engineer','IT projektový manažer','CAD konstruktér',
      'Strojní inženýr','Procesní inženýr','Technolog výroby',
    ],
  },
  {
    cs: 'Obchod a maloobchod',
    pozice: [
      'Prodavač / prodavačka','Pokladní','Doplňovač zboží','Pracovník supermarketu',
      'Pracovník čerpací stanice','Skladník prodejny','Vedoucí směny',
      'Vedoucí prodejny','Obchodní zástupce','Obchodní manažer','Pracovník e-shopu',
      'Pracovník zákaznického centra',
    ],
  },
  {
    cs: 'Ostatní profese a služby',
    pozice: [
      'Bezpečnostní pracovník','Ostraha objektů','Pracovník letiště',
      'Pracovník odbavení zavazadel','Pracovník poštovních služeb',
      'Pracovník komunálních služeb','Pracovník odpadového hospodářství',
      'Technik recyklace','Kadeřník','Kosmetička','Masér','Plavčík',
      'Animátor','Sportovní trenér','Pracovník sezónních služeb',
    ],
  },
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

// ─── ACCORDION SELEKTOR ────────────────────────────────────────────────────
function ProfeseSelector({
  isDE,
  selected,
  onChange,
}: {
  isDE: boolean
  selected: string[]
  onChange: (val: string[]) => void
}) {
  const [openCat, setOpenCat] = useState<string | null>(null)

  const toggle = (pozice: string) => {
    onChange(
      selected.includes(pozice)
        ? selected.filter(p => p !== pozice)
        : [...selected, pozice]
    )
  }

  const catCount = (cat: { pozice: string[] }) =>
    cat.pozice.filter(p => selected.includes(p)).length

  return (
    <div className="space-y-1">
      {PROFESE_KATEGORIE.map((cat) => {
        const count = catCount(cat)
        const isOpen = openCat === cat.cs
        return (
          <div key={cat.cs} className="border border-gray-100 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenCat(isOpen ? null : cat.cs)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-700">{cat.cs}</span>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: '#eaf3e8', color: '#2a4f2d' }}
                  >
                    {count}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-3 pt-1 bg-gray-50 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {cat.pozice.map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={selected.includes(p)}
                      onChange={() => toggle(p)}
                      className="accent-green-700 w-4 h-4 flex-shrink-0"
                    />
                    {p}
                  </label>
                ))}
              </div>
            )}
          </div>
        )
      })}
      {selected.length > 0 && (
        <div className="mt-2 p-3 rounded-lg text-xs" style={{ background: '#eaf3e8', color: '#2a4f2d' }}>
          <span className="font-medium">
            {isDE ? 'Ausgewählt' : 'Vybráno'} ({selected.length}):
          </span>{' '}
          {selected.join(', ')}
        </div>
      )}
    </div>
  )
}

// ─── HLAVNÍ FORMULÁŘ ───────────────────────────────────────────────────────
export default function DotaznikForm({ locale }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [chceCV, setChceCV] = useState(false)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captcha, setCaptcha] = useState({ a: 0, b: 0 })
  const [selectedProfese, setSelectedProfese] = useState<string[]>([])

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
    if (selectedProfese.length === 0 && !data.profeseJina) {
      alert(isDE ? 'Bitte wählen Sie mindestens einen Beruf aus.' : 'Vyberte prosím alespoň jednu profesi.')
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
      selectedProfese.forEach(p => formData.append('profese_list', p))
      if (fotoFile) formData.append('foto', fotoFile)
      if (cvFile) formData.append('cv', cvFile)

      const res = await fetch('/api/dotaznik', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      setStatus('success')
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'Lead', { content_name: 'dotaznik' })
      }
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
        <p className="text-xs text-gray-400 mb-3">
          {label(
            'Klikněte na kategorii a vyberte konkrétní pozice.',
            'Klicken Sie auf eine Kategorie und wählen Sie Positionen aus.'
          )}
        </p>
        <ProfeseSelector
          isDE={isDE}
          selected={selectedProfese}
          onChange={setSelectedProfese}
        />
        <div className="mt-4">
          <label className="form-label">{label('Jiná profese (neuvedená výše)', 'Anderer Beruf (nicht aufgeführt)')}</label>
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