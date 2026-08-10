'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import RichEditor from '@/components/ui/RichEditor'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const TYPE_OPTIONS = [
  { value: 'fulltime',  labelCs: 'Plný úvazek',     labelDe: 'Vollzeit' },
  { value: 'parttime',  labelCs: 'Zkrácený úvazek', labelDe: 'Teilzeit' },
  { value: 'temporary', labelCs: 'Dočasný',          labelDe: 'Zeitarbeit' },
]

export default function NewJobPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const copyFromId = searchParams.get('copyFrom')

  const [saving, setSaving] = useState(false)
  const [loadingCopy, setLoadingCopy] = useState(!!copyFromId)
  const [listingType, setListingType] = useState<'standard' | 'general'>('standard')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFileDe, setImageFileDe] = useState<File | null>(null)
  const [imagePreviewDe, setImagePreviewDe] = useState<string | null>(null)
  const [imageFileFb, setImageFileFb] = useState<File | null>(null)
  const [imagePreviewFb, setImagePreviewFb] = useState<string | null>(null)
  // Existující URL fotek z kopírovaného inzerátu - použijí se, pokud admin nenahraje nový soubor
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [existingImageUrlDe, setExistingImageUrlDe] = useState<string | null>(null)
  const [existingImageUrlFb, setExistingImageUrlFb] = useState<string | null>(null)
  const [copiedFromTitle, setCopiedFromTitle] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['fulltime'])
  const [form, setForm] = useState({
    title_cs: '', title_de: '',
    description_cs: '', description_de: '',
    location: '', salary_range: '',
    sector: 'other', active: true, maps_url: '',
  })

  useEffect(() => {
    if (!copyFromId) return
    supabase.from('jobs').select('*').eq('id', copyFromId).single().then(({ data }) => {
      if (data) {
        setForm({
          title_cs: data.title_cs ?? '',
          title_de: data.title_de ?? '',
          description_cs: data.description_cs ?? '',
          description_de: data.description_de ?? '',
          location: data.location ?? '',
          salary_range: data.salary_range ?? '',
          sector: data.sector ?? 'other',
          active: true,
          maps_url: data.maps_url ?? '',
        })
        setListingType(data.listing_type === 'general' ? 'general' : 'standard')
        if (data.type) setSelectedTypes(data.type.split(',').map((t: string) => t.trim()))
        if (data.og_image_url) { setExistingImageUrl(data.og_image_url); setImagePreview(data.og_image_url) }
        if (data.og_image_url_de) { setExistingImageUrlDe(data.og_image_url_de); setImagePreviewDe(data.og_image_url_de) }
        if (data.og_image_fb_url) { setExistingImageUrlFb(data.og_image_fb_url); setImagePreviewFb(data.og_image_fb_url) }
        setCopiedFromTitle(data.title_cs)
      }
      setLoadingCopy(false)
    })
  }, [copyFromId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleImageDe = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFileDe(file)
    setImagePreviewDe(URL.createObjectURL(file))
  }

  const handleImageFb = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFileFb(file)
    setImagePreviewFb(URL.createObjectURL(file))
  }

  const toggleType = (value: string) => {
    setSelectedTypes(prev =>
      prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
    )
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[áàâä]/g, 'a').replace(/[čć]/g, 'c').replace(/[ď]/g, 'd')
      .replace(/[éěèê]/g, 'e').replace(/[íìî]/g, 'i').replace(/[ňń]/g, 'n')
      .replace(/[óôö]/g, 'o').replace(/[řŕ]/g, 'r').replace(/[šś]/g, 's')
      .replace(/[ťţ]/g, 't').replace(/[úůùû]/g, 'u').replace(/[ýÿ]/g, 'y')
      .replace(/[žź]/g, 'z')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now()
  }

  const uploadImage = async (file: File, prefix: string) => {
    const filename = `jobs/${Date.now()}-${prefix}-${file.name}`
    const { error } = await supabase.storage
      .from('job-images')
      .upload(filename, file, { contentType: file.type })
    if (error) return null
    const { data } = supabase.storage.from('job-images').getPublicUrl(filename)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTypes.length === 0) {
      alert('Vyberte alespoň jeden typ úvazku')
      return
    }
    if (listingType === 'general' && !imageFileFb && !existingImageUrlFb) {
      alert('U obecného inzerátu je fotografie pro Facebook povinná')
      return
    }
    setSaving(true)

    const slug = generateSlug(form.title_cs)

    if (listingType === 'general') {
      const og_image_fb_url = imageFileFb ? await uploadImage(imageFileFb, 'fb') : existingImageUrlFb

      const { error } = await supabase.from('jobs').insert({
        title_cs: form.title_cs,
        title_de: '',
        description_cs: '',
        description_de: '',
        location: form.location,
        salary_range: '',
        sector: form.sector,
        active: form.active,
        maps_url: '',
        slug,
        type: selectedTypes.join(','),
        listing_type: 'general',
        og_image_url: null,
        og_image_url_de: null,
        og_image_fb_url,
      })

      if (error) {
        alert('Chyba při ukládání: ' + error.message)
        setSaving(false)
      } else {
        router.push('/admin/jobs')
      }
      return
    }

    const og_image_url = imageFile ? await uploadImage(imageFile, 'cs') : existingImageUrl
    const og_image_url_de = imageFileDe ? await uploadImage(imageFileDe, 'de') : existingImageUrlDe
    const og_image_fb_url = imageFileFb ? await uploadImage(imageFileFb, 'fb') : existingImageUrlFb

    const { error } = await supabase.from('jobs').insert({
      ...form,
      title_de: form.title_de,
      description_cs: form.description_cs,
      description_de: form.description_de,
      salary_range: form.salary_range,
      maps_url: form.maps_url,
      slug,
      type: selectedTypes.join(','),
      listing_type: 'standard',
      og_image_url,
      og_image_url_de,
      og_image_fb_url,
    })

    if (error) {
      alert('Chyba při ukládání: ' + error.message)
      setSaving(false)
    } else {
      router.push('/admin/jobs')
    }
  }

  if (loadingCopy) {
    return <div className="text-sm text-gray-400">Načítám data ke kopírování...</div>
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Nový inzerát</h1>
      </div>

      {copiedFromTitle && (
        <div className="rounded-lg px-4 py-2.5 mb-4 text-xs" style={{ background: '#fdf0e0', color: '#e07b0a' }}>
          Zkopírováno z inzerátu „{copiedFromTitle}" – zkontrolujte a upravte údaje, případně vyměňte fotky.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Typ inzerátu</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setListingType('standard')}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-medium border text-left"
            style={{
              borderColor: listingType === 'standard' ? '#2a4f2d' : '#e5e7eb',
              background: listingType === 'standard' ? '#eaf3e8' : '#fff',
              color: listingType === 'standard' ? '#2a4f2d' : '#6b7280',
            }}
          >
            Standardní pozice
            <p className="text-xs font-normal mt-1" style={{ color: '#9ca3af' }}>
              Konkrétní pracovní místo, CS + DE, na /jobs/[slug]
            </p>
          </button>
          <button
            type="button"
            onClick={() => setListingType('general')}
            className="flex-1 px-4 py-3 rounded-lg text-sm font-medium border text-left"
            style={{
              borderColor: listingType === 'general' ? '#2a4f2d' : '#e5e7eb',
              background: listingType === 'general' ? '#eaf3e8' : '#fff',
              color: listingType === 'general' ? '#2a4f2d' : '#6b7280',
            }}
          >
            Obecný inzerát („Hledáš práci?")
            <p className="text-xs font-normal mt-1" style={{ color: '#9ca3af' }}>
              Pouze česky, odkazuje na dotazník, na /hledas/[slug], mimo přehled /jobs
            </p>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Základní informace</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">
                {listingType === 'general' ? 'Nadpis inzerátu *' : 'Název pozice (CS) *'}
              </label>
              <input
                name="title_cs"
                value={form.title_cs}
                onChange={handleChange}
                className="form-input"
                required
                placeholder={listingType === 'general' ? 'Hledáš práci? Ozvi se nám!' : 'Skladník'}
              />
            </div>
            {listingType === 'standard' && (
              <div>
                <label className="form-label">Název pozice (DE) *</label>
                <input name="title_de" value={form.title_de} onChange={handleChange} className="form-input" required placeholder="Lagerarbeiter" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Lokalita *</label>
              <input name="location" value={form.location} onChange={handleChange} className="form-input" required placeholder="Regen, DE" />
            </div>
            {listingType === 'standard' && (
              <div>
                <label className="form-label">Mzda</label>
                <input name="salary_range" value={form.salary_range} onChange={handleChange} className="form-input" placeholder="od 14 €/h" />
              </div>
            )}
          </div>
          <div>
            <label className="form-label mb-2 block">Typ úvazku * (lze vybrat více)</label>
            <div className="flex gap-4">
              {TYPE_OPTIONS.map(({ value, labelCs, labelDe }) => (
                <label key={value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(value)}
                    onChange={() => toggleType(value)}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: '#2a4f2d' }}
                  />
                  <span className="text-sm text-gray-700">{labelCs}</span>
                  {listingType === 'standard' && <span className="text-xs text-gray-400">/ {labelDe}</span>}
                </label>
              ))}
            </div>
          </div>
        </div>

        {listingType === 'standard' ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Fotografie & Mapa</h2>

            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="form-label">Fotografie – česká verze (CS)</label>
                <p className="text-xs text-gray-400 mb-2">
                  {existingImageUrl && !imageFile ? 'Použije se zkopírovaná fotka, pokud nenahrajete novou.' : 'Doporučeno 940×788px'}
                </p>
                {imagePreview && (
                  <img src={imagePreview} alt="Náhled CS" className="mb-3 rounded-lg border border-gray-100 w-full" style={{ maxHeight: '160px', objectFit: 'contain', background: '#f9fafb' }} />
                )}
                <input type="file" accept="image/*" onChange={handleImage} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700" />
              </div>
              <div>
                <label className="form-label">Fotografie – německá verze (DE)</label>
                <p className="text-xs text-gray-400 mb-2">
                  {existingImageUrlDe && !imageFileDe ? 'Použije se zkopírovaná fotka, pokud nenahrajete novou.' : 'Pokud není vyplněno, použije se CS obrázek'}
                </p>
                {imagePreviewDe && (
                  <img src={imagePreviewDe} alt="Náhled DE" className="mb-3 rounded-lg border border-gray-100 w-full" style={{ maxHeight: '160px', objectFit: 'contain', background: '#f9fafb' }} />
                )}
                <input type="file" accept="image/*" onChange={handleImageDe} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700" />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Fotografie pro Facebook / sdílení (1200×630px)</label>
              <p className="text-xs text-gray-400 mb-2">
                {existingImageUrlFb && !imageFileFb ? 'Použije se zkopírovaná fotka, pokud nenahrajete novou.' : 'Optimální rozměr pro sdílení na sociálních sítích. Pokud není vyplněno, použije se CS obrázek.'}
              </p>
              {imagePreviewFb && (
                <img src={imagePreviewFb} alt="Náhled FB" className="mb-3 rounded-lg border border-gray-100 w-full" style={{ maxHeight: '160px', objectFit: 'contain', background: '#f9fafb' }} />
              )}
              <input type="file" accept="image/*" onChange={handleImageFb} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700" />
            </div>

            <div>
              <label className="form-label">Odkaz na mapu (Google Maps URL)</label>
              <input name="maps_url" value={form.maps_url} onChange={handleChange} className="form-input" placeholder="https://maps.google.com/?q=Regen,DE" />
              <p className="text-xs text-gray-400 mt-1">Otevřete Google Maps, najděte místo, klikněte Sdílet → zkopírujte odkaz</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Fotografie pro Facebook *</h2>
            <p className="text-xs text-gray-400 mb-2">
              {existingImageUrlFb && !imageFileFb ? 'Použije se zkopírovaná fotka, pokud nenahrajete novou.' : '1200×630px – jediný obrázek u obecného inzerátu, povinný.'}
            </p>
            {imagePreviewFb && (
              <img src={imagePreviewFb} alt="Náhled FB" className="mb-3 rounded-lg border border-gray-100 w-full" style={{ maxHeight: '160px', objectFit: 'contain', background: '#f9fafb' }} />
            )}
            <input type="file" accept="image/*" onChange={handleImageFb} required={!existingImageUrlFb} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700" />
          </div>
        )}

        {listingType === 'standard' && (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Popis pozice – česky</h2>
              <RichEditor
                value={form.description_cs}
                onChange={(val) => setForm(prev => ({ ...prev, description_cs: val }))}
                placeholder="Popis pracovní pozice v češtině..."
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Stellenbeschreibung – Deutsch</h2>
              <RichEditor
                value={form.description_de}
                onChange={(val) => setForm(prev => ({ ...prev, description_de: val }))}
                placeholder="Stellenbeschreibung auf Deutsch..."
              />
            </div>
          </>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm(prev => ({ ...prev, active: e.target.checked }))} className="w-4 h-4 accent-green-700" />
            <span className="text-sm text-gray-600">Okamžitě zveřejnit na webu</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: '#2a4f2d' }}>
            {saving ? 'Ukládám...' : 'Uložit inzerát'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
            Zrušit
          </button>
        </div>
      </form>
    </div>
  )
}
