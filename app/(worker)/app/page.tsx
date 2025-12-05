'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { WorkerDashboard } from './WorkerDashboard'
import { listPacklists, Packlist } from '@/lib/firestore'
import { useCurrentUser } from '@/lib/auth/useCurrentUser'

export default function WorkerDashboardPage() {
  const t = useTranslations('worker.dashboard')
  const { user } = useCurrentUser()
  const [packlists, setPacklists] = useState<Packlist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadPacklists = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        console.log('Loading packlists for user:', user.uid)

        // Get all packlists (no status filter to include all)
        const allPacklists = await listPacklists()

        console.log('All packlists:', allPacklists.map(p => ({
          id: p.id,
          status: p.status,
          assignedUserIds: p.assignedUserIds
        })))

        // Filter for current user
        const assignedPacklists = allPacklists.filter(
          (p) => p.assignedUserIds.includes(user.uid)
        )

        console.log('Assigned to this user:', assignedPacklists.length)

        setPacklists(assignedPacklists)
      } catch (error) {
        console.error('Failed to load packlists:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPacklists()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <WorkerDashboard packlists={packlists} />
    </div>
  )
}
