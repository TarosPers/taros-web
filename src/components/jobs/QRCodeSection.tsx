'use client'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  url: string
  locale: string
}

export default function QRCodeSection({ url, locale }: Props) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <QRCodeSVG
        value={url}
        size={80}
        bgColor="#ffffff"
        fgColor="#2a4f2d"
        level="M"
        includeMargin={true}
      />
      <span className="text-xs text-gray-400">
        {locale === 'de' ? 'QR-Code teilen' : 'Sdílet QR kódem'}
      </span>
    </div>
  )
}
