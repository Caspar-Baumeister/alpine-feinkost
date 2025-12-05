'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Package, Store, ClipboardList, Users } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  listProducts,
  listPos,
  listPacklists,
  listUsers
} from '@/lib/firestore'

interface Stats {
  products: number
  pos: number
  openPacklists: number
  users: number
}

export default function AdminDashboardPage() {
  const t = useTranslations()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [products, pos, packlists, users] = await Promise.all([
          listProducts(),
          listPos(),
          listPacklists({ status: ['open', 'currently_selling'] }),
          listUsers()
        ])

        setStats({
          products: products.length,
          pos: pos.filter((p) => p.active).length,
          openPacklists: packlists.length,
          users: users.filter((u) => u.active).length
        })
      } catch (error) {
        console.error('Failed to load stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const statsItems = [
    { key: 'products', value: stats?.products ?? 0, icon: Package, label: t('nav.products') },
    { key: 'pos', value: stats?.pos ?? 0, icon: Store, label: t('nav.pos') },
    { key: 'openPacklists', value: stats?.openPacklists ?? 0, icon: ClipboardList, label: t('user.openPacklists') },
    { key: 'users', value: stats?.users ?? 0, icon: Users, label: t('nav.users') }
  ]

  return (
    <div>
      <PageHeader
        title={t('nav.dashboard')}
        description={t('app.subtitle')}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsItems.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity Placeholder */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">
          Letzte Aktivitäten
        </h2>
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Hier werden kürzlich durchgeführte Aktionen angezeigt.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
