'use client'

import { useEffect, useState, use } from 'react'
import { useTranslations } from 'next-intl'
import { notFound } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PacklistDetail } from './PacklistDetail'
import { getPacklist, Packlist } from '@/lib/firestore'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function WorkerPacklistPage({ params }: PageProps) {
  const { id } = use(params)
  const [packlist, setPacklist] = useState<Packlist | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  const loadPacklist = async () => {
    try {
      const data = await getPacklist(id)
      if (!data) {
        setNotFoundState(true)
      } else {
        setPacklist(data)
      }
    } catch (error) {
      console.error('Failed to load packlist:', error)
      setNotFoundState(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPacklist()
  }, [id])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFoundState || !packlist) {
    notFound()
  }

  return <PacklistDetail packlist={packlist} onUpdate={loadPacklist} />
}
