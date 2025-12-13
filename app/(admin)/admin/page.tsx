'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ArrowUpRight,
  ClipboardList,
  Package,
  ShoppingCart,
  Store,
  Ticket,
  CalendarDays
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listOrders, Order } from '@/lib/firestore'
import { useLocale } from 'next-intl'

const placeholderStats = [
  {
    key: 'revenue',
    label: 'Revenue (14d)',
    value: '€48.2k',
    hint: 'Coming soon',
    icon: ArrowUpRight
  },
  {
    key: 'units',
    label: 'Units sold (14d)',
    value: '3.4k',
    hint: 'Coming soon',
    icon: ShoppingCart
  },
  {
    key: 'packlists',
    label: 'Packlists planned',
    value: '12',
    hint: 'Coming soon',
    icon: ClipboardList
  },
  {
    key: 'pos',
    label: 'Active POS',
    value: '8',
    hint: 'Coming soon',
    icon: Store
  }
]

const topSellers = [
  { name: 'Alpenkäse Premium', quantity: '620 kg', revenue: '€12.4k' },
  { name: 'Speck Auswahlbox', quantity: '410 Stk', revenue: '€9.1k' },
  { name: 'Bergkräuter Mix', quantity: '330 Stk', revenue: '€6.8k' },
  { name: 'Frischer Joghurt', quantity: '280 Becher', revenue: '€3.9k' }
]

const restockItems = [
  { name: 'Bio Alpenbutter', current: '8 kg', minimum: '10 kg' },
  { name: 'Heublumen Tee', current: '14 Stk', minimum: '20 Stk' },
  { name: 'Rauchschinken', current: '6 kg', minimum: '15 kg' },
  { name: 'Walnuss Brotaufstrich', current: '12 Gläser', minimum: '18 Gläser' }
]

const upcomingPacklists = [
  { name: 'Wochenmarkt Innsbruck', date: 'Fr, 15. März', status: 'Planned / waiting for sale' },
  { name: 'POS Kufstein', date: 'Sa, 16. März', status: 'Planned / waiting for sale' },
  { name: 'Hotel Alpenblick', date: 'Mo, 18. März', status: 'Planned / waiting for sale' }
]

const openTickets = [
  { orderId: '#10421', customer: 'Maria H.', channel: 'Webshop', status: 'Open' },
  { orderId: '#10418', customer: 'Simon B.', channel: 'Click & Collect', status: 'Pending' }
]

export default function AdminDashboardPage() {
  const t = useTranslations()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <PageHeader
          title={t('nav.dashboard')}
          description="High-level overview for sales & operations. Real data integration coming soon."
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Last 14 days</span>
          <Badge variant="secondary">Static preview</Badge>
        </div>
      </div>

      <StatGrid />

      <div className="grid gap-6 lg:grid-cols-2">
        <UpcomingDeliveriesCard />
        <TopSellingProductsCard />
        <RestockNeededCard />
        <ReadyPacklistsCard />
        <OpenTicketsCard />
      </div>
    </div>
  )
}

function StatGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {placeholderStats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.key} className="border-dashed">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function TopSellingProductsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Top selling products</CardTitle>
            <CardDescription>Last 14 days • Real data integration coming soon</CardDescription>
          </div>
          <Badge variant="outline">Preview</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-dashed border-muted p-3 text-sm text-muted-foreground">
          This section will later use packlist & ticket data to highlight best performers.
        </div>
        <div className="space-y-3">
          {topSellers.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between rounded-lg border border-muted/50 bg-muted/30 px-4 py-3"
            >
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="text-sm text-muted-foreground">{item.quantity} sold</span>
              </div>
              <span className="text-sm font-semibold text-emerald-500">{item.revenue}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RestockNeededCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products that need restocking</CardTitle>
        <CardDescription>This will surface items below their minimum stock levels.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {restockItems.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3"
          >
            <div>
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                Current: {item.current} • Minimum: {item.minimum} • Coming soon
              </p>
            </div>
            <Badge variant="secondary">Placeholder</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ReadyPacklistsCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Packlists ready for sale</CardTitle>
          <CardDescription>Upcoming packlists that are prepared and waiting to go live.</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/packlists">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-dashed border-muted p-3 text-sm text-muted-foreground">
          Upcoming packlists that are ready to go will appear here.
        </div>
        {upcomingPacklists.map((packlist) => (
          <div key={packlist.name} className="rounded-lg border px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{packlist.name}</p>
              <Badge variant="secondary">{packlist.date}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{packlist.status} – coming soon</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function UpcomingDeliveriesCard() {
  const t = useTranslations('dashboard')
  const tOrders = useTranslations('orders')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const loadOrders = async () => {
      try {
        // Load all orders and filter client-side to avoid composite index requirements
        const allOrders = await listOrders()
        // Filter to only open and check_pending orders
        const upcomingOrders = allOrders.filter(
          (order) => order.status === 'open' || order.status === 'check_pending'
        )
        // Sort by expected arrival date ascending
        upcomingOrders.sort((a, b) => a.expectedArrivalDate.getTime() - b.expectedArrivalDate.getTime())
        // Take first 5
        setOrders(upcomingOrders.slice(0, 5))
        setHasError(false)
      } catch (error) {
        console.error('Failed to load orders:', error)
        setHasError(true)
        // Set empty array on error so UI shows "no orders" instead of breaking
        setOrders([])
      } finally {
        setIsLoading(false)
      }
    }
    loadOrders()
  }, [])

  const isOverdue = (order: Order) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expectedDate = new Date(order.expectedArrivalDate)
    expectedDate.setHours(0, 0, 0, 0)
    return expectedDate < today
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{t('upcomingDeliveries')}</CardTitle>
          <CardDescription>{t('upcomingDeliveriesDescription')}</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">{t('viewAllOrders')}</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            {locale === 'de' ? 'Laden...' : 'Loading...'}
          </div>
        ) : hasError ? (
          <div className="rounded-lg border border-dashed border-muted p-3 text-sm text-muted-foreground">
            {locale === 'de' ? 'Fehler beim Laden der Bestellungen' : 'Error loading orders'}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted p-3 text-sm text-muted-foreground">
            {t('noUpcomingDeliveries')}
          </div>
        ) : (
          orders.map((order) => {
            const overdue = isOverdue(order)
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex flex-col rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground">
                    {order.name || `#${order.id.slice(0, 8)}`}
                  </p>
                  <div className="flex items-center gap-2">
                    {overdue && (
                      <Badge variant="destructive" className="text-xs">
                        {t('overdue')}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {tOrders(`status.${order.status}`)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {format(order.expectedArrivalDate, 'PP', { locale: dateLocale })}
                  </p>
                </div>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function OpenTicketsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Open webshop tickets (coming soon)</CardTitle>
        <CardDescription>Webshop integration coming soon. Placeholder structure for customer orders.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {openTickets.map((ticket) => (
          <div
            key={ticket.orderId}
            className="flex flex-col rounded-lg border border-muted/60 bg-muted/20 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{ticket.orderId}</p>
              <Badge variant="outline">{ticket.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {ticket.customer} • {ticket.channel} • Coming soon
            </p>
          </div>
        ))}
        <div className="rounded-lg border border-dashed border-muted p-3 text-sm text-muted-foreground">
          Here you will see open customer orders from the webshop that still need processing.
        </div>
      </CardContent>
    </Card>
  )
}
