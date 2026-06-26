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
  phone:     z.string().optional(),
  message:   z.string().optional(),
  gdpr:      z.literal(true, { errorMap: () => ({ message: 'Povinné' }) }),
})
type FormData = z.infer<typeof schema>

interface Props { jobId: string; jobTitle: string }

export default function ApplicationForm({ jobId, jobTitle }: Props) {
  const t = useTranslations('application')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [cvFile, setCvFile] = useState<File | null>(null)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setStatus('loading')
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)))
      formData.append('jobId', jobId)
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
      <div className="bg-green-light border border-green-DEFAULT/20 rounded-xl p-6 text-center sticky top-20">
        <div className="text-green-DEFAULT text-4xl mb-3">✓</div>
        <p className="text-green-dark font-medium">{t('success')}</p>
      </div>
    )
  }

  return (
    <div className="bg-green-pale rounded-xl p-5 border border-gray-100 sticky top-20">
      <h3 className="text-base font-medium text-charcoal mb-4">{t('title')}: {jobTitle}</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="form-label">{t('firstName')} *</label>
            <input {...register('firstName')} className="form-input" />
          </div>
          <div>
            <label className="form-label">{t('lastName')} *</label>
            <input {...register('lastName')} className="form-input" />
          </div>
        </div>

        <div>
          <label className="form-label">{t('email')} *</label>
          <input type="email" {...register('email')} className="form-input" />
        </div>

        <div>
          <label className="form-label">{t('phone')}</label>
          <input type="tel" {...register('phone')} className="form-input" />
        </div>

        <div>
          <label className="form-label">{t('message')}</label>
          <textarea rows={3} {...register('message')} className="form-input resize-none" />
        </div>

        <div>
          <label className="form-label">{t('cv')}</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-green-light file:text-green-dark hover:file:bg-green-light/80"
          />
        </div>

        <div className="flex items-start gap-2">
          <input type="checkbox" {...register('gdpr')} className="mt-0.5 accent-green-DEFAULT" />
          <label className="text-xs text-gray-500 leading-relaxed">
            {t('gdpr')}{' '}
            <a href="/privacy" className="text-green-DEFAULT underline">{t('gdprLink')}</a>{' '}
            {t('gdprSuffix')} *
          </label>
        </div>
        {errors.gdpr && <p className="text-xs text-red-500">Povinné pole</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="btn-primary w-full justify-center mt-1 disabled:opacity-60"
        >
          {status === 'loading' ? '...' : t('submit')}
        </button>

        {status === 'error' && <p className="text-xs text-red-500 text-center">{t('error')}</p>}
      </form>
    </div>
  )
}
