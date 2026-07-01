'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'

const schema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  phone:     z.string().min(1),
  message:   z.string().optional(),
  gdpr:      z.literal(true, { errorMap: () => ({ message: 'Povinné' }) }),
})
type FormData = z.infer<typeof schema>

interface Props {
  jobId: string
  jobTitle: string
  jobLocation: string
  locale: string
}

export default function JobApplicationForm({ jobId, jobTitle, jobLocation, locale }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [cvFile, setCvFile] = useState<File | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const subject = `${jobTitle}, ${jobLocation}`
  const isDE = locale === 'de'

  const onSubmit = async (data: FormData) => {
    setStatus('loading')
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)))
      formData.append('jobId', jobId)
      formData.append('jobTitle', jobTitle)
      formData.append('subject', subject)
      if (cvFile) formData.append('cv', cvFile)
      const res = await fetch('/api/apply', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">✅</div>
        <p className="text-sm font-medium" style={{ color: '#2a4f2d' }}>
          {isDE ? 'Bewerbung gesendet! Wir melden uns in 48 Stunden.' : 'Přihláška odeslána! Ozveme se do 48 hodin.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Jméno + Příjmení */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">{isDE ? 'Vorname' : 'Jméno'} *</label>
          <input {...register('firstName')} className={`form-input ${errors.firstName ? 'border-red-300' : ''}`} />
        </div>
        <div>
          <label className="form-label">{isDE ? 'Nachname' : 'Příjmení'} *</label>
          <input {...register('lastName')} className={`form-input ${errors.lastName ? 'border-red-300' : ''}`} />
        </div>
      </div>

      {/* Email + Telefon vedle sebe */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">{isDE ? 'E-Mail' : 'E-mail'} *</label>
          <input type="email" {...register('email')} className={`form-input ${errors.email ? 'border-red-300' : ''}`} />
        </div>
        <div>
          <label className="form-label">{isDE ? 'Telefon' : 'Telefon'}*</label>
          <input type="tel" {...register('phone')} className="form-input" />
        </div>
      </div>

      {/* Pozice – automaticky vyplněna */}
      <div>
        <label className="form-label">{isDE ? 'Stelle / Ort' : 'Pozice / Město'}</label>
        <input
          value={subject}
          readOnly
          className="form-input"
          style={{ background: '#f9fafb', color: '#6b7280', cursor: 'default' }}
        />
      </div>

      {/* Zpráva */}
      <div>
        <label className="form-label">{isDE ? 'Nachricht (optional)' : 'Zpráva (volitelně)'}</label>
        <textarea {...register('message')} className="form-input resize-none" rows={3} />
      </div>

      {/* CV + GDPR vedle sebe */}
      <div className="grid grid-cols-2 gap-4 items-start">
        <div>
          <label className="form-label">{isDE ? 'Lebenslauf (PDF, max. 5 MB)' : 'Životopis (PDF, max. 5 MB)'}</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700"
          />
        </div>
        <div className="flex items-start gap-2 pt-5">
          <input type="checkbox" {...register('gdpr')} className="mt-0.5 w-4 h-4 cursor-pointer flex-shrink-0" style={{ accentColor: '#2a4f2d' }} />
          <label className="text-xs text-gray-500 leading-relaxed cursor-pointer">
            {isDE ? 'Ich habe die ' : 'Přečetl(a) jsem si '}
            <a href="/privacy" className="underline" style={{ color: '#2a4f2d' }}>
              {isDE ? 'Datenschutzerklärung' : 'Zásady ochrany osobních údajů'}
            </a>
            {isDE ? ' gelesen und stimme zu.' : ' a souhlasím.'} *
          </label>
        </div>
      </div>
      {errors.gdpr && <p className="text-xs text-red-500">Povinné pole</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-3 rounded-lg text-sm font-medium text-white disabled:opacity-60 transition-colors"
        style={{ background: '#e07b0a' }}
      >
        {status === 'loading'
          ? (isDE ? 'Wird gesendet...' : 'Odesílám...')
          : (isDE ? 'Bewerbung absenden' : 'Odeslat přihlášku')}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-500 text-center">
          {isDE ? 'Fehler. Bitte erneut versuchen.' : 'Chyba. Zkuste to znovu.'}
        </p>
      )}
    </form>
  )
}