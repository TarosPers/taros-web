'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
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

export default function EditJobPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFileDe, setImageFileDe] = useState<File | null>(null)
  const [imagePreviewDe, setImagePreviewDe] = useState<string | null>(null)
  const [imageFileFb, setImageFileFb] = useState<File | null>(null)
  const [imagePreviewFb, setImagePreviewFb] = useState<string | null>(null)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['fulltime'])
  const [form, setForm] = useState({
    title_cs: '', title_de: '',
    description_cs: '', description_de: '',
    location: '', salary_range: '',
    sector: 'other', active: true, maps_url: '',
    og_image_url: '',
    og_image_url_de: '',
    og_image_fb_url: '',
  })

  useEffect(() => {
    supabase.from('jobs').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) {
        setForm(data)
        if (data.og_image_url) setImagePreview(data.og_image_url)
        if (data.og_image_url_de) setImagePreviewDe(data.og_image_url_de)
        if (data.og_image_fb_url) setImagePreviewFb(data.og_image_fb_url)
        if (data.type) {
          setSelectedTypes(data.type.split(',').map((t: string) => t.trim()))
        }
      }
      setLoading(false)
    })
  }, [params.id])

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
    setSaving(true)

    let og_image_url = form.og_image_url
    let og_image_url_de = form.og_image_url_de
    let og_image_fb_url = form.og_image_fb_url

    if (imageFile) og_image_url = await uploadImage(imageFile, 'cs') ?? og_image_url
    if (imageFileDe) og_image_url_de = await uploadImage(imageFileDe, 'de') ?? og_image_url_de
    if (imageFileFb) og_image_fb_url = await uploadImage(imageFileFb, 'fb') ?? og_image_fb_url

    const { error } = await supabase.from('jobs').update({
      ...form,
      type: selectedTypes.join(','),
      og_image_url,
      og_image_url_de,
      og_image_fb_url,
    }).eq('id', params.id)

    if (error) {
      alert('Chyba: ' + error.message)
      setSaving(false)
    } else {
      router.push('/admin/jobs')
    }
  }

  if (loading) return <div className="text-sm text-gray-400">Načítám...</div>

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Zpět</button>
        <h1 className="text-xl font-medium" style={{ color: '#1a1a1a' }}>Upravit inzerát</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Základní informace</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Název pozice (CS) *</label>
              <input name="title_cs" value={form.title_cs} onChange={handleChange} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Název pozice (DE) *</label>
              <input name="title_de" value={form.title_de} onChange={handleChange} className="form-input" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Lokalita *</label>
              <input name="location" value={form.location} onChange={handleChange} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Mzda</label>
              <input name="salary_range" value={form.salary_range ?? ''} onChange={handleChange} className="form-input" />
            </div>
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
                  <span className="text-xs text-gray-400">/ {labelDe}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Fotografie & Mapa</h2>

          <div className="grid grid-cols-2 gap-6 mb-4">
            <div>
              <label className="form-label">Fotografie – česká verze (CS)</label>
              <p className="text-xs text-gray-400 mb-2">Doporučeno 940×788px</p>
              {imagePreview && (
                <img src={imagePreview} alt="Náhled CS" className="mb-3 rounded-lg border border-gray-100 w-full" style={{ maxHeight: '160px', objectFit: 'contain', background: '#f9fafb' }} />
              )}
              <input type="file" accept="image/*" onChange={handleImage} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700" />
            </div>
            <div>
              <label className="form-label">Fotografie – německá verze (DE)</label>
              <p className="text-xs text-gray-400 mb-2">Pokud není vyplněno, použije se CS obrázek</p>
              {imagePreviewDe && (
                <img src={imagePreviewDe} alt="Náhled DE" className="mb-3 rounded-lg border border-gray-100 w-full" style={{ maxHeight: '160px', objectFit: 'contain', background: '#f9fafb' }} />
              )}
              <input type="file" accept="image/*" onChange={handleImageDe} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700" />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label">Fotografie pro Facebook / sdílení (1200×630px)</label>
            <p className="text-xs text-gray-400 mb-2">Optimální rozměr pro sdílení na sociálních sítích. Pokud není vyplněno, použije se CS obrázek.</p>
            {imagePreviewFb && (
              <img src={imagePreviewFb} alt="Náhled FB" className="mb-3 rounded-lg border border-gray-100 w-full" style={{ maxHeight: '160px', objectFit: 'contain', background: '#f9fafb' }} />
            )}
            <input type="file" accept="image/*" onChange={handleImageFb} className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:cursor-pointer file:bg-green-50 file:text-green-700" />
          </div>

          <div>
            <label className="form-label">Odkaz na mapu (Google Maps URL)</label>
            <input name="maps_url" value={form.maps_url ?? ''} onChange={handleChange} className="form-input" placeholder="https://maps.google.com/?q=Regen,DE" />
            <p className="text-xs text-gray-400 mt-1">Otevřete Google Maps, najděte místo, klikněte Sdílet → zkopírujte odkaz</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Popis – česky</h2>
          <RichEditor
            value={form.description_cs}
            onChange={(val) => setForm(prev => ({ ...prev, description_cs: val }))}
            placeholder="Popis pracovní pozice v češtině..."
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-medium mb-4" style={{ color: '#1a1a1a' }}>Beschreibung – Deutsch</h2>
          <RichEditor
            value={form.description_de}
            onChange={(val) => setForm(prev => ({ ...prev, description_de: val }))}
            placeholder="Stellenbeschreibung auf Deutsch..."
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm(prev => ({ ...prev, active: e.target.checked }))} className="w-4 h-4 accent-green-700" />
            <span className="text-sm text-gray-600">Zveřejněno na webu</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-60" style={{ background: '#2a4f2d' }}>
            {saving ? 'Ukládám...' : 'Uložit změny'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50">
            Zrušit
          </button>
        </div>
      </form>
    </div>
  )
}
