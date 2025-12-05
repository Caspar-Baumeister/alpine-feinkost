'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { TemplatesTable } from './TemplatesTable'
import { listPacklistTemplates, PacklistTemplate } from '@/lib/firestore'

export default function TemplatesPage() {
  const t = useTranslations('templates')
  const [templates, setTemplates] = useState<PacklistTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadTemplates = async () => {
    try {
      const data = await listPacklistTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
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
      <TemplatesTable initialData={templates} onDataChange={loadTemplates} />
    </div>
  )
}
