'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Plus, Eye, CalendarDays, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { StatusBadge } from '@/components/status-badge'
import { Packlist, Pos, AppUser, PacklistStatus } from '@/lib/firestore'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface PacklistsTableProps {
  initialData: Packlist[]
  posList: Pos[]
  users: AppUser[]
  onDataChange: () => void
}

type FilterStatus = 'all' | PacklistStatus

export function PacklistsTable({ initialData, posList, users }: PacklistsTableProps) {
  const t = useTranslations('packlists')
  const tActions = useTranslations('actions')
  const tStatus = useTranslations('status')

  // Filter state
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [posFilter, setPosFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({})

  // Create lookup maps
  const userMap = useMemo(() => {
    const map = new Map<string, string>()
    users.forEach((u) => map.set(u.uid, u.displayName))
    return map
  }, [users])

  // Apply filters
  const filteredData = useMemo(() => {
    return initialData.filter((packlist) => {
      if (statusFilter !== 'all' && packlist.status !== statusFilter) {
        return false
      }
      if (posFilter !== 'all' && packlist.posId !== posFilter) {
        return false
      }
      if (dateRange.from) {
        const packlistDate = new Date(packlist.date)
        if (packlistDate < dateRange.from) return false
      }
      if (dateRange.to) {
        const packlistDate = new Date(packlist.date)
        if (packlistDate > dateRange.to) return false
      }
      return true
    })
  }, [initialData, statusFilter, posFilter, dateRange])

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return '—'
    return `€${value.toFixed(2)}`
  }

  const getDifference = (expected?: number | null, reported?: number | null) => {
    if (expected === undefined || expected === null || reported === undefined || reported === null) return '—'
    const diff = reported - expected
    const formatted = `€${Math.abs(diff).toFixed(2)}`
    if (diff > 0) return <span className="text-emerald-400">+{formatted}</span>
    if (diff < 0) return <span className="text-red-400">-{formatted}</span>
    return formatted
  }

  const getAssignedUserNames = (userIds: string[]) => {
    return userIds.map((id) => userMap.get(id) || id)
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
              <SelectItem value="open">{tStatus('open')}</SelectItem>
              <SelectItem value="currently_selling">{tStatus('currentlySelling')}</SelectItem>
              <SelectItem value="sold">{tStatus('sold')}</SelectItem>
              <SelectItem value="completed">{tStatus('completed')}</SelectItem>
            </SelectContent>
          </Select>

          {/* POS Filter */}
          <Select value={posFilter} onValueChange={setPosFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t('filters.pos')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allPos')}</SelectItem>
              {posList.map((pos) => (
                <SelectItem key={pos.id} value={pos.id}>
                  {pos.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start">
                <CalendarDays className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'dd.MM.yy')} - {format(dateRange.to, 'dd.MM.yy')}
                    </>
                  ) : (
                    format(dateRange.from, 'dd.MM.yyyy')
                  )
                ) : (
                  t('filters.dateRange')
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                locale={de}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Create Button */}
        <Button asChild>
          <Link href="/admin/packlists/create">
            <Plus className="h-4 w-4 mr-2" />
            {t('createPacklist')}
          </Link>
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.id')}</TableHead>
                <TableHead>{t('columns.pos')}</TableHead>
                <TableHead>{t('columns.date')}</TableHead>
                <TableHead>{t('columns.assignedUsers')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead className="text-right">{t('columns.expectedCash')}</TableHead>
                <TableHead className="text-right">{t('columns.reportedCash')}</TableHead>
                <TableHead className="text-right">{t('columns.difference')}</TableHead>
                <TableHead className="w-[100px]">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Keine Packlisten vorhanden
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((packlist) => (
                  <TableRow key={packlist.id}>
                    <TableCell className="font-mono text-sm">{packlist.id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-medium">{packlist.posName}</TableCell>
                    <TableCell>
                      {format(new Date(packlist.date), 'dd.MM.yyyy', { locale: de })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getAssignedUserNames(packlist.assignedUserIds).map((name, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={packlist.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(packlist.expectedCash)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(packlist.reportedCash)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getDifference(packlist.expectedCash, packlist.reportedCash)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/packlists/${packlist.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          {tActions('view')}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
