import { Packlist } from '@/lib/firestore/types'
import { format, subDays, isAfter, isBefore, startOfDay } from 'date-fns'

export type TimeRange = '30' | '90' | '180' | 'all'

export interface DailyRevenue {
  date: string // YYYY-MM-DD format
  revenue: number
}

export interface EntityRevenue {
  entityId: string
  entityName: string
  dailyData: DailyRevenue[]
  totalRevenue: number
}

export interface StatisticsData {
  byPos: EntityRevenue[]
  byProduct: EntityRevenue[]
  hasData: boolean
}

/**
 * Calculate sold quantity for a packlist item
 */
function calculateSoldQuantity(item: Packlist['items'][0]): number {
  const startQty = item.startQuantity ?? item.plannedQuantity
  const endQty = item.endQuantity ?? 0
  return Math.max(0, startQty - endQty)
}

/**
 * Get effective price for a packlist item (special price or base price)
 */
function getEffectivePrice(item: Packlist['items'][0]): number {
  return item.specialPrice ?? item.basePrice
}

/**
 * Calculate revenue for a single packlist item
 */
function calculateItemRevenue(item: Packlist['items'][0]): number {
  const soldQty = calculateSoldQuantity(item)
  const price = getEffectivePrice(item)
  return soldQty * price
}

/**
 * Filter packlists by time range
 */
export function filterByTimeRange(
  packlists: Packlist[],
  timeRange: TimeRange
): Packlist[] {
  if (timeRange === 'all') {
    return packlists
  }

  const days = parseInt(timeRange, 10)
  const cutoffDate = startOfDay(subDays(new Date(), days))

  return packlists.filter((p) => {
    const packlistDate = new Date(p.date)
    return isAfter(packlistDate, cutoffDate) || format(packlistDate, 'yyyy-MM-dd') === format(cutoffDate, 'yyyy-MM-dd')
  })
}

/**
 * Get date range for x-axis based on time range
 */
export function getDateRange(timeRange: TimeRange): { start: Date; end: Date } {
  const end = new Date()
  let start: Date

  if (timeRange === 'all') {
    // Go back 365 days as a reasonable default for "all time"
    start = subDays(end, 365)
  } else {
    const days = parseInt(timeRange, 10)
    start = subDays(end, days)
  }

  return { start: startOfDay(start), end: startOfDay(end) }
}

/**
 * Calculate statistics from completed packlists
 */
export function calculateStatistics(
  completedPacklists: Packlist[],
  timeRange: TimeRange
): StatisticsData {
  if (completedPacklists.length === 0) {
    return {
      byPos: [],
      byProduct: [],
      hasData: false
    }
  }

  // Filter by time range
  const filteredPacklists = filterByTimeRange(completedPacklists, timeRange)

  if (filteredPacklists.length === 0) {
    return {
      byPos: [],
      byProduct: [],
      hasData: true // There is data, just not in this time range
    }
  }

  // Calculate by POS
  const posDailyMap = new Map<string, Map<string, number>>() // posId -> date -> revenue
  const posNames = new Map<string, string>() // posId -> posName

  // Calculate by Product
  const productDailyMap = new Map<string, Map<string, number>>() // productId -> date -> revenue
  const productNames = new Map<string, string>() // productId -> productName

  for (const packlist of filteredPacklists) {
    const dateKey = format(new Date(packlist.date), 'yyyy-MM-dd')

    // Initialize POS entry if needed
    if (!posDailyMap.has(packlist.posId)) {
      posDailyMap.set(packlist.posId, new Map())
      posNames.set(packlist.posId, packlist.posName)
    }

    const posDaily = posDailyMap.get(packlist.posId)!

    // Calculate revenue for each item
    for (const item of packlist.items) {
      const itemRevenue = calculateItemRevenue(item)

      // Add to POS revenue
      const currentPosRevenue = posDaily.get(dateKey) || 0
      posDaily.set(dateKey, currentPosRevenue + itemRevenue)

      // Add to Product revenue
      if (!productDailyMap.has(item.productId)) {
        productDailyMap.set(item.productId, new Map())
        productNames.set(item.productId, item.productName)
      }

      const productDaily = productDailyMap.get(item.productId)!
      const currentProductRevenue = productDaily.get(dateKey) || 0
      productDaily.set(dateKey, currentProductRevenue + itemRevenue)
    }
  }

  // Convert to EntityRevenue format
  const byPos: EntityRevenue[] = Array.from(posDailyMap.entries()).map(
    ([posId, dailyMap]) => {
      const dailyData = Array.from(dailyMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date))

      const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0)

      return {
        entityId: posId,
        entityName: posNames.get(posId) || posId,
        dailyData,
        totalRevenue
      }
    }
  )

  const byProduct: EntityRevenue[] = Array.from(productDailyMap.entries()).map(
    ([productId, dailyMap]) => {
      const dailyData = Array.from(dailyMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date))

      const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0)

      return {
        entityId: productId,
        entityName: productNames.get(productId) || productId,
        dailyData,
        totalRevenue
      }
    }
  )

  // Sort by total revenue descending
  byPos.sort((a, b) => b.totalRevenue - a.totalRevenue)
  byProduct.sort((a, b) => b.totalRevenue - a.totalRevenue)

  return {
    byPos,
    byProduct,
    hasData: true
  }
}

/**
 * Prepare chart data for selected entities
 */
export function prepareChartData(
  entities: EntityRevenue[],
  selectedIds: string[],
  timeRange: TimeRange
): { date: string; [key: string]: number | string }[] {
  if (selectedIds.length === 0) {
    return []
  }

  const selectedEntities = entities.filter((e) => selectedIds.includes(e.entityId))

  if (selectedEntities.length === 0) {
    return []
  }

  // Get all unique dates from selected entities
  const allDates = new Set<string>()
  selectedEntities.forEach((entity) => {
    entity.dailyData.forEach((d) => allDates.add(d.date))
  })

  // Sort dates
  const sortedDates = Array.from(allDates).sort()

  // Create chart data with all entities
  return sortedDates.map((date) => {
    const dataPoint: { date: string; [key: string]: number | string } = { date }

    selectedEntities.forEach((entity) => {
      const dayData = entity.dailyData.find((d) => d.date === date)
      dataPoint[entity.entityId] = dayData?.revenue ?? 0
    })

    return dataPoint
  })
}

/**
 * Generate a color for an entity based on its index
 */
const CHART_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
]

export function getEntityColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Format date for display
 */
export function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

