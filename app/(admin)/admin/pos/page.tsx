'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { POSTable } from './POSTable'
import { listPos, Pos } from '@/lib/firestore'

export default function POSPage() {
  const t = useTranslations('pos')
  const [posList, setPosList] = useState<Pos[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadPos = async () => {
    try {
      const data = await listPos()
      setPosList(data)
    } catch (error) {
      console.error('Failed to load POS:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPos()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <POSTable initialData={posList} onDataChange={loadPos} />
    </div>
  )
}
