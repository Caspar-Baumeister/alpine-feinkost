'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { PacklistsTable } from './PacklistsTable'
import { listPacklists, listPos, listUsers, Packlist, Pos, AppUser } from '@/lib/firestore'

export default function PacklistsPage() {
  const t = useTranslations('packlists')
  const [packlists, setPacklists] = useState<Packlist[]>([])
  const [posList, setPosList] = useState<Pos[]>([])
  const [users, setUsers] = useState<AppUser[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      const [packlistsData, posData, usersData] = await Promise.all([
        listPacklists(),
        listPos(),
        listUsers()
      ])
      setPacklists(packlistsData)
      setPosList(posData)
      setUsers(usersData)
    } catch (error) {
      console.error('Failed to load data:', error)
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
      <PacklistsTable
        initialData={packlists}
        posList={posList}
        users={users}
        onDataChange={loadData}
      />
    </div>
  )
}
