'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { OrderTemplatesTable } from './OrderTemplatesTable'
import { listOrderTemplates, OrderTemplate } from '@/lib/firestore'

export default function OrderTemplatesPage() {
  const t = useTranslations('orderTemplates')
  const [templates, setTemplates] = useState<OrderTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const templatesData = await listOrderTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('Failed to load order templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
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
      <OrderTemplatesTable initialData={templates} onDataChange={loadData} />
    </div>
  )
}

