'use client'

import { PageHeader } from '@/components/page-header'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'
import {
  AppUser,
  listPacklistTemplates,
  listPos,
  listProducts,
  listUsers,
  PacklistTemplate,
  Pos,
  Product
} from '@/lib/firestore'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { PacklistForm } from './PacklistForm'

export default function CreatePacklistPage() {
  const t = useTranslations('packlists')
  const { firebaseUser, isLoading: authLoading } = useCurrentUser()
  const [products, setProducts] = useState<Product[]>([])
  const [posList, setPosList] = useState<Pos[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [templates, setTemplates] = useState<PacklistTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to be ready before loading data
    if (authLoading) return

    const loadData = async () => {
      // Ensure auth is ready
      if (!firebaseUser) {
        setIsLoading(false)
        return
      }

      // Load data sequentially and set state immediately after each successful call
      // This way, if one call fails, the others still show
      try {
        const productsData = await listProducts()
        setProducts(productsData.filter((p) => p.isActive))
      } catch (error) {
        console.error('Failed to load products:', error)
      }

      try {
        const posData = await listPos()
        setPosList(posData.filter((p) => p.active))
      } catch (error) {
        console.error('Failed to load POS:', error)
      }

      try {
        const usersData = await listUsers()
        setUsers(usersData.filter((u) => u.active))
      } catch (error) {
        console.error('Failed to load users:', error)
      }

      try {
        const templatesData = await listPacklistTemplates()
        setTemplates(templatesData)
      } catch (error) {
        // Handle permission errors gracefully - treat as "no templates available"
        // This can happen if the templates collection doesn't exist yet or rules deny access
        const errorCode = (error as any)?.code
        if (errorCode === 'permission-denied' || errorCode === 'permissions-denied') {
          // Silently handle missing templates collection
          setTemplates([])
        } else {
          console.error('Failed to load templates:', error)
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
