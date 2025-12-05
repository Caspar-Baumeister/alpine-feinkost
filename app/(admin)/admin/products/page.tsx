'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { ProductsTable } from './ProductsTable'
import { listProducts, Product } from '@/lib/firestore'

export default function ProductsPage() {
  const t = useTranslations('products')
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadProducts = async () => {
    try {
      const data = await listProducts()
      setProducts(data)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
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
      <ProductsTable initialData={products} onDataChange={loadProducts} />
    </div>
  )
}
