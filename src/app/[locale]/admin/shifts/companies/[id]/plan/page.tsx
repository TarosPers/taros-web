'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ShiftCompanyPlanRedirect({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    router.replace(`/admin/shifts/plan?company=${params.id}`)
  }, [params.id, router])

  return <div className="text-sm text-gray-400">Přesměrovávám...</div>
}
