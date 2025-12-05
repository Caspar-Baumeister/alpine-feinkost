'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { PacklistForm } from './PacklistForm'
import {
  listProducts,
  listPos,
  listUsers,
  listPacklistTemplates,
  Product,
  Pos,
  AppUser,
  PacklistTemplate
} from '@/lib/firestore'

export default function CreatePacklistPage() {
  const t = useTranslations('packlists')
  const [products, setProducts] = useState<Product[]>([])
  const [posList, setPosList] = useState<Pos[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [templates, setTemplates] = useState<PacklistTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, posData, usersData, templatesData] = await Promise.all([
          listProducts(),
          listPos(),
          listUsers(),
          listPacklistTemplates()
        ])
        setProducts(productsData.filter((p) => p.isActive))
        setPosList(posData.filter((p) => p.active))
        setUsers(usersData.filter((u) => u.active))
        setTemplates(templatesData)
      } catch (error) {
        console.error('Failed to load data:', error)
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

  return (
    <div>
      <PageHeader title={t('createPacklist')} />
      <PacklistForm
        products={products}
        posList={posList}
        users={users}
        templates={templates}
      />
    </div>
  )
}
