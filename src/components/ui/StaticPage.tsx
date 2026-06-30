import Navbar from '@/components/ui/Navbar'

interface Props {
  title: string
  content: string
}

export default function StaticPage({ title, content }: Props) {
  const cleanContent = content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .trim()

  return (
    <>
      <Navbar />
      <div className="w-full py-8" style={{ background: '#2a4f2d' }}>
        <div className="max-w-7xl mx-auto px-8">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
      </div>
      <main className="max-w-7xl mx-auto">
        <div className="px-8 py-10">
          {cleanContent ? (
            <div
              className="prose prose-sm max-w-3xl leading-relaxed"
              style={{ color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: cleanContent }}
            />
          ) : (
            <p className="text-gray-400 text-sm">Obsah stránky bude brzy doplněn.</p>
          )}
        </div>
      </main>
    </>
  )
}
