'use client'

import { useState, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format } from 'date-fns'
import { de, enUS } from 'date-fns/locale'
import {
  Store,
  ShoppingBag,
  X,
  Plus,
  TrendingUp,
  BarChart3,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Packlist, Pos, Product } from '@/lib/firestore'
import {
  calculateStatistics,
  prepareChartData,
  getEntityColor,
  formatCurrency,
  TimeRange,
  EntityRevenue
} from '@/lib/statistics/calculateStats'

interface StatisticsViewProps {
  completedPacklists: Packlist[]
  posList: Pos[]
  products: Product[]
}

type ViewMode = 'pos' | 'product'

const MAX_SELECTION = 5

export function StatisticsView({
  completedPacklists,
  posList,
  products
}: StatisticsViewProps) {
  const t = useTranslations('statistics')
  const locale = useLocale()
  const dateLocale = locale === 'de' ? de : enUS

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('pos')
  const [timeRange, setTimeRange] = useState<TimeRange>('90')
  const [selectedPosIds, setSelectedPosIds] = useState<string[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [posSearchOpen, setPosSearchOpen] = useState(false)
  const [productSearchOpen, setProductSearchOpen] = useState(false)

  // Calculate statistics
  const stats = useMemo(
    () => calculateStatistics(completedPacklists, timeRange),
    [completedPacklists, timeRange]
  )

  // Get chart data based on view mode
  const chartData = useMemo(() => {
    if (viewMode === 'pos') {
      return prepareChartData(stats.byPos, selectedPosIds, timeRange)
    }
    return prepareChartData(stats.byProduct, selectedProductIds, timeRange)
  }, [viewMode, stats, selectedPosIds, selectedProductIds, timeRange])

  // Get selected entities with colors
  const selectedEntities = useMemo(() => {
    const entities = viewMode === 'pos' ? stats.byPos : stats.byProduct
    const selectedIds = viewMode === 'pos' ? selectedPosIds : selectedProductIds

    return selectedIds
      .map((id, index) => {
        const entity = entities.find((e) => e.entityId === id)
        return entity
          ? { ...entity, color: getEntityColor(index) }
          : null
      })
      .filter(Boolean) as (EntityRevenue & { color: string })[]
  }, [viewMode, stats, selectedPosIds, selectedProductIds])

  // Calculate total revenue for selected entities
  const totalRevenue = useMemo(() => {
    return selectedEntities.reduce((sum, e) => sum + e.totalRevenue, 0)
  }, [selectedEntities])

  // Top performers
  const topPerformers = useMemo(() => {
    const entities = viewMode === 'pos' ? stats.byPos : stats.byProduct
    return entities.slice(0, 3)
  }, [viewMode, stats])

  // Handlers
  const handleAddPos = (posId: string) => {
    if (selectedPosIds.length >= MAX_SELECTION) return
    if (!selectedPosIds.includes(posId)) {
      setSelectedPosIds([...selectedPosIds, posId])
    }
    setPosSearchOpen(false)
  }

  const handleRemovePos = (posId: string) => {
    setSelectedPosIds(selectedPosIds.filter((id) => id !== posId))
  }

  const handleAddProduct = (productId: string) => {
    if (selectedProductIds.length >= MAX_SELECTION) return
    if (!selectedProductIds.includes(productId)) {
      setSelectedProductIds([...selectedProductIds, productId])
    }
    setProductSearchOpen(false)
  }

  const handleRemoveProduct = (productId: string) => {
    setSelectedProductIds(selectedProductIds.filter((id) => id !== productId))
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const formattedDate = format(new Date(label), 'PPP', { locale: dateLocale })

    return (
      <div className="rounded-lg border bg-popover p-3 shadow-md">
        <p className="mb-2 text-sm font-medium">{formattedDate}</p>
        {payload.map((entry: any, index: number) => {
          const entity = selectedEntities.find(
            (e) => e.entityId === entry.dataKey
          )
          return (
            <div
              key={index}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                {entity?.entityName}
              </span>
              <span className="font-medium">{formatCurrency(entry.value)}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // No completed packlists at all
  if (!stats.hasData && completedPacklists.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('noCompletedPacklists')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentSelection = viewMode === 'pos' ? selectedPosIds : selectedProductIds
  const availableEntities = viewMode === 'pos'
    ? posList.filter((p) => !selectedPosIds.includes(p.id) && p.active)
    : products.filter((p) => !selectedProductIds.includes(p.id) && p.isActive)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="pos" className="gap-2">
                  <Store className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('byPos')}</span>
                </TabsTrigger>
                <TabsTrigger value="product" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('byProduct')}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Time Range */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {t('timeRange')}:
              </span>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">{t('last30days')}</SelectItem>
                  <SelectItem value="90">{t('last90days')}</SelectItem>
                  <SelectItem value="180">{t('last180days')}</SelectItem>
                  <SelectItem value="all">{t('allTime')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Entity Selection */}
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              {/* Selected entities as chips */}
              {selectedEntities.map((entity) => (
                <Badge
                  key={entity.entityId}
                  variant="secondary"
                  className="gap-1 pr-1"
                  style={{ borderColor: entity.color, borderWidth: 2 }}
                >
                  <span
                    className="h-2 w-2 rounded-full mr-1"
                    style={{ backgroundColor: entity.color }}
                  />
                  {entity.entityName}
                  <button
                    onClick={() =>
                      viewMode === 'pos'
                        ? handleRemovePos(entity.entityId)
                        : handleRemoveProduct(entity.entityId)
                    }
                    className="ml-1 rounded-full p-0.5 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              {/* Add button */}
              {currentSelection.length < MAX_SELECTION && (
                <Popover
                  open={viewMode === 'pos' ? posSearchOpen : productSearchOpen}
                  onOpenChange={viewMode === 'pos' ? setPosSearchOpen : setProductSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      {viewMode === 'pos' ? t('addPos') : t('addProduct')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder={
                          viewMode === 'pos' ? t('selectPos') : t('selectProducts')
                        }
                      />
                      <CommandList>
                        <CommandEmpty>
                          {locale === 'de' ? 'Nichts gefunden' : 'Nothing found'}
                        </CommandEmpty>
                        <CommandGroup>
                          {viewMode === 'pos'
                            ? (availableEntities as Pos[]).map((pos) => (
                                <CommandItem
                                  key={pos.id}
                                  onSelect={() => handleAddPos(pos.id)}
                                >
                                  {pos.name}
                                </CommandItem>
                              ))
                            : (availableEntities as Product[]).map((product) => (
                                <CommandItem
                                  key={product.id}
                                  onSelect={() => handleAddProduct(product.id)}
                                >
                                  {product.name}
                                </CommandItem>
                              ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}

              {/* Max selection hint */}
              {currentSelection.length >= MAX_SELECTION && (
                <span className="text-xs text-muted-foreground">
                  {t('maxSelection', { max: MAX_SELECTION })}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('revenue')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentSelection.length === 0 ? (
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {t('selectAtLeastOne', {
                  entity: viewMode === 'pos' ? t('posEntity') : t('productEntity')
                })}
              </p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t('noDataInRange')}</p>
            </div>
          ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-border"
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      format(new Date(value), 'dd.MM', { locale: dateLocale })
                    }
                    className="text-xs"
                    stroke="currentColor"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis
                    tickFormatter={(value) => `€${value}`}
                    className="text-xs"
                    stroke="currentColor"
                    tick={{ fill: 'currentColor' }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => {
                      const entity = selectedEntities.find(
                        (e) => e.entityId === value
                      )
                      return entity?.entityName || value
                    }}
                  />
                  {selectedEntities.map((entity) => (
                    <Line
                      key={entity.entityId}
                      type="monotone"
                      dataKey={entity.entityId}
                      name={entity.entityId}
                      stroke={entity.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {currentSelection.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Total Revenue */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('totalRevenue')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {viewMode === 'pos'
                  ? `${selectedPosIds.length} ${locale === 'de' ? 'Verkaufsstelle(n)' : 'point(s) of sale'}`
                  : `${selectedProductIds.length} ${locale === 'de' ? 'Produkt(e)' : 'product(s)'}`
                }
              </p>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('topPerformers')}</CardTitle>
            </CardHeader>
            <CardContent>
              {topPerformers.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t('noData')}</p>
              ) : (
                <div className="space-y-2">
                  {topPerformers.map((entity, index) => (
                    <div
                      key={entity.entityId}
                      className="flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                          {index + 1}.
                        </span>
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {entity.entityName}
                        </span>
                      </span>
                      <span className="text-sm font-medium">
                        {formatCurrency(entity.totalRevenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

