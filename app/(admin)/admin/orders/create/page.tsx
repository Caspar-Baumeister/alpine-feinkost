'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PageHeader } from '@/components/page-header'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import {
  listProducts,
  listOrderTemplates,
  type Product,
  type OrderTemplate
} from '@/lib/firestore'
import { OrderForm } from './OrderForm'

export default function CreateOrderPage() {
  const t = useTranslations('orders')
  const { firebaseUser, isLoading: authLoading } = useCurrentUser()
  const [products, setProducts] = useState<Product[]>([])
  const [templates, setTemplates] = useState<OrderTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    const loadData = async () => {
      if (!firebaseUser) {
        setIsLoading(false)
        return
      }

      try {
        const productsData = await listProducts()
        setProducts(productsData.filter((p) => p.isActive))
      } catch (error) {
        console.error('Failed to load products:', error)
        setProducts([])
      }

      try {
        const templatesData = await listOrderTemplates()
        setTemplates(templatesData)
      } catch (error) {
        const errorCode = (error as any)?.code
        if (errorCode === 'permission-denied' || errorCode === 'permissions-denied') {
          // Silently handle missing permission / collection: treat as no templates
          setTemplates([])
        } else {
          console.error('Failed to load order templates:', error)
          setTemplates([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [firebaseUser, authLoading])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={t('createOrder')} description={t('description')} />
      <OrderForm products={products} templates={templates} />
    </div>
  )
}


