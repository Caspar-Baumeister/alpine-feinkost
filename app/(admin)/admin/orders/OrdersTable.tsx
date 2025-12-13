'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Plus, Eye, CalendarDays } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Order, OrderStatus } from '@/lib/firestore'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

interface OrdersTableProps {
  initialData: Order[]
  onDataChange: () => void
}

type FilterStatus = 'all' | OrderStatus

export function OrdersTable({ initialData, onDataChange }: OrdersTableProps) {
  const t = useTranslations('orders')
  const tActions = useTranslations('actions')
  const tDashboard = useTranslations('dashboard')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS

  // Filter state
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')

  // Apply filters
  const filteredData = useMemo(() => {
    let filtered = initialData
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }
    return filtered.sort((a, b) => {
      // Sort by expected arrival date ascending
      return a.expectedArrivalDate.getTime() - b.expectedArrivalDate.getTime()
    })
  }, [initialData, statusFilter])

  const getStatusBadge = (status: OrderStatus) => {
    const statusMap = {
      open: { label: t('status.open'), variant: 'default' as const },
      check_pending: { label: t('status.check_pending'), variant: 'secondary' as const },
      completed: { label: t('status.completed'), variant: 'outline' as const }
    }
    const statusInfo = statusMap[status]
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const isOverdue = (order: Order) => {
    if (order.status === 'completed') return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expectedDate = new Date(order.expectedArrivalDate)
    expectedDate.setHours(0, 0, 0, 0)
    return expectedDate < today
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allStatuses')}</SelectItem>
              <SelectItem value="open">{t('status.open')}</SelectItem>
              <SelectItem value="check_pending">{t('status.check_pending')}</SelectItem>
              <SelectItem value="completed">{t('status.completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/admin/orders/create">
            <Plus className="mr-2 h-4 w-4" />
            {t('createOrder')}
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('columns.name')}</TableHead>
                <TableHead>{t('columns.orderDate')}</TableHead>
                <TableHead>{t('columns.expectedArrival')}</TableHead>
                <TableHead>{t('columns.status')}</TableHead>
                <TableHead>{t('columns.productCount')}</TableHead>
                <TableHead className="text-right">{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((order) => (
                  <TableRow
                    key={order.id}
                    className={isOverdue(order) ? 'bg-destructive/5' : ''}
                  >
                    <TableCell className="font-medium">
                      {order.name || `#${order.id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell>
                      {format(order.orderDate, 'PP', { locale: dateLocale })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className={isOverdue(order) ? 'text-destructive font-medium' : ''}>
                          {format(order.expectedArrivalDate, 'PP', { locale: dateLocale })}
                        </span>
                        {isOverdue(order) && (
                          <Badge variant="destructive" className="text-xs">
                            {tDashboard('overdue')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
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

