'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Tag, Search } from 'lucide-react'

interface SortimentFiltersProps {
  labelFilter: string | null
  labelName: string | null
  queryFilter: string | null
  filterByLabelText: string
  searchForText: string
  clearFilterText: string
}

export function SortimentFilters({
  labelFilter,
  labelName,
  queryFilter,
  filterByLabelText,
  searchForText,
  clearFilterText
}: SortimentFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const clearFilter = useCallback(
    (key: 'label' | 'q') => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(key)
      const newPath = params.toString() ? `/sortiment?${params.toString()}` : '/sortiment'
      startTransition(() => {
        router.push(newPath)
      })
    },
    [router, searchParams]
  )

  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      router.push('/sortiment')
    })
  }, [router])

  const hasMultipleFilters = labelFilter && queryFilter

  return (
    <div className="flex flex-wrap items-center gap-2">
      {labelFilter && (
        <Badge
          variant="secondary"
          className="gap-1.5 py-1.5 pl-2.5 pr-1.5 text-sm"
        >
          <Tag className="h-3.5 w-3.5" />
          <span>
            {filterByLabelText}: <strong>{labelName}</strong>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:bg-muted"
            onClick={() => clearFilter('label')}
            aria-label={clearFilterText}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {queryFilter && (
        <Badge
          variant="secondary"
          className="gap-1.5 py-1.5 pl-2.5 pr-1.5 text-sm"
        >
          <Search className="h-3.5 w-3.5" />
          <span>
            {searchForText}: <strong>"{queryFilter}"</strong>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:bg-muted"
            onClick={() => clearFilter('q')}
            aria-label={clearFilterText}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {hasMultipleFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 text-muted-foreground hover:text-foreground"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {clearFilterText}
        </Button>
      )}
    </div>
  )
}


