'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { StatisticsView } from './StatisticsView'
import { listPacklists, listPos, listProducts, Packlist, Pos, Product } from '@/lib/firestore'

export default function StatisticsPage() {
  const t = useTranslations('statistics')
  const [completedPacklists, setCompletedPacklists] = useState<Packlist[]>([])
  const [posList, setPosList] = useState<Pos[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [packlistsData, posData, productsData] = await Promise.all([
          listPacklists({ status: ['completed'] }),
          listPos(),
          listProducts()
        ])

        setCompletedPacklists(packlistsData)
        setPosList(posData)
        setProducts(productsData)
      } catch (err) {
        console.error('Failed to load statistics data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center text-destructive">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <StatisticsView
        completedPacklists={completedPacklists}
        posList={posList}
        products={products}
      />
    </div>
  )
}

