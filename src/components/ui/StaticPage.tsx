import Navbar from '@/components/ui/Navbar'

interface Props {
  title: string
  content: string
}

export default function StaticPage({ title, content }: Props) {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto">
        {/* Zelený pruh s názvem */}
        <div className="px-8 py-8" style={{ background: '#2a4f2d' }}>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>

        {/* Obsah */}
        <div className="px-8 py-10">
          {content ? (
            <div
              className="prose prose-sm max-w-3xl leading-relaxed"
              style={{ color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className="text-gray-400 text-sm">Obsah stránky bude brzy doplněn.</p>
          )}
        </div>
      </main>
    </>
  )
}
