'use client'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'

const schema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  subject:   z.string().min(1),
  message:   z.string().min(10),
  gdpr:      z.literal(true, { errorMap: () => ({ message: 'Povinné' }) }),
})
type FormData = z.infer<typeof schema>

export default function ContactForm() {
  const t = useTranslations('contact')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      reset()
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-light border border-green-DEFAULT/20 rounded-xl p-6 text-center">
        <div className="text-green-DEFAULT text-4xl mb-3">✓</div>
        <p className="text-green-dark font-medium">{t('formSuccess')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-green-pale rounded-xl p-6 border border-gray-100">
      {/* Jméno + Příjmení */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="form-label">{t('formName')} <span className="text-amber-DEFAULT">*</span></label>
          <input {...register('firstName')} className={`form-input ${errors.firstName ? 'border-red-400' : ''}`} />
        </div>
        <div>
          <label className="form-label">{t('formSurname')} <span className="text-amber-DEFAULT">*</span></label>
          <input {...register('lastName')} className={`form-input ${errors.lastName ? 'border-red-400' : ''}`} />
        </div>
      </div>

      {/* Email */}
      <div className="mb-3">
        <label className="form-label">{t('formEmail')} <span className="text-amber-DEFAULT">*</span></label>
        <input type="email" {...register('email')} className={`form-input ${errors.email ? 'border-red-400' : ''}`} />
      </div>

      {/* Předmět */}
      <div className="mb-3">
        <label className="form-label">{t('formSubject')} <span className="text-amber-DEFAULT">*</span></label>
        <input {...register('subject')} className={`form-input ${errors.subject ? 'border-red-400' : ''}`} />
      </div>

      {/* Zpráva */}
      <div className="mb-3">
        <label className="form-label">{t('formMessage')} <span className="text-amber-DEFAULT">*</span></label>
        <textarea rows={3} {...register('message')} className={`form-input resize-none ${errors.message ? 'border-red-400' : ''}`} />
      </div>

      {/* reCAPTCHA placeholder */}
      <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-4 py-2.5 mb-3">
        <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0" />
        <span className="text-sm text-gray-500 flex-1">{t('formNotRobot')}</span>
        <div className="text-[10px] text-gray-400 text-right leading-tight">reCAPTCHA<br/>Ochrana · Podmínky</div>
      </div>

      {/* GDPR */}
      <div className="flex items-start gap-2.5 mb-4">
        <input
          type="checkbox"
          {...register('gdpr')}
          className="mt-0.5 w-4 h-4 accent-green-DEFAULT cursor-pointer"
        />
        <label className="text-xs text-gray-500 leading-relaxed cursor-pointer">
          {t('formGdpr')}{' '}
          <a href="/privacy" className="text-green-DEFAULT underline">{t('formGdprLink')}</a>{' '}
          {t('formGdprSuffix')} <span className="text-amber-DEFAULT">*</span>
        </label>
      </div>
      {errors.gdpr && <p className="text-xs text-red-500 -mt-3 mb-3">Povinné pole</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-primary w-full justify-center disabled:opacity-60"
      >
        {status === 'loading' ? '...' : t('formSubmit')}
      </button>

      {status === 'error' && (
        <p className="text-xs text-red-500 mt-2 text-center">{t('formError')}</p>
      )}
    </form>
  )
}
