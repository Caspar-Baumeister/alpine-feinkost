'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { OrdersTable } from './OrdersTable'
import { listOrders, Order } from '@/lib/firestore'

export default function OrdersPage() {
  const t = useTranslations('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const ordersData = await listOrders()
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load orders:', error)
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
      <OrdersTable initialData={orders} onDataChange={loadData} />
    </div>
  )
}

