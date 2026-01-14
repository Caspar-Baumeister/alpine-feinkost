'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Tag, Package, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getPublicStorageUrl } from '@/lib/storage/publicUrl'
import {
  SearchIndex,
  SearchResult,
  searchIndex as performSearch
} from '@/lib/public/search-index'

interface WebshopSearchProps {
  searchIndex: SearchIndex
  locale: 'de' | 'en'
}

// Hook to track if component has mounted (for avoiding hydration mismatches with Radix IDs)
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

function ProductResultItem({
  result,
  onSelect,
  locale
}: {
  result: SearchResult
  onSelect: () => void
  locale: 'de' | 'en'
}) {
  const imageUrl = result.imagePath ? getPublicStorageUrl(result.imagePath) : null
  const unitLabel = result.unitType === 'piece' ? (locale === 'de' ? 'Stück' : 'piece') : 'kg'
  const priceDisplay = result.price
    ? `€${result.price.toFixed(2)}/${unitLabel}`
    : null

  return (
    <CommandItem
      value={`product-${result.id}`}
      onSelect={onSelect}
      className="flex items-center gap-3 py-2.5 cursor-pointer"
    >
      {imageUrl ? (
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate font-medium">{result.name}</span>
        {priceDisplay && (
          <span className="text-xs text-muted-foreground">{priceDisplay}</span>
        )}
      </div>
    </CommandItem>
  )
}

function LabelResultItem({
  result,
  onSelect
}: {
  result: SearchResult
  onSelect: () => void
}) {
  return (
    <CommandItem
      value={`label-${result.id}`}
      onSelect={onSelect}
      className="flex items-center gap-3 py-2.5 cursor-pointer"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Tag className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
        <span className="truncate font-medium">{result.name}</span>
        <span className="text-xs text-muted-foreground">{result.slug}</span>
      </div>
    </CommandItem>
  )
}

function SearchContent({
  query,
  setQuery,
  results,
  locale,
  onSelectProduct,
  onSelectLabel,
  placeholder,
  noResultsText,
  productsLabel,
  labelsLabel
}: {
  query: string
  setQuery: (q: string) => void
  results: { products: SearchResult[]; labels: SearchResult[] }
  locale: 'de' | 'en'
  onSelectProduct: (id: string) => void
  onSelectLabel: (slug: string) => void
  placeholder: string
  noResultsText: string
  productsLabel: string
  labelsLabel: string
}) {
  const hasResults = results.products.length > 0 || results.labels.length > 0
  const showEmpty = query.trim().length > 0 && !hasResults

  return (
    <Command shouldFilter={false} className="rounded-lg border shadow-md">
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
        className="h-11"
      />
      <CommandList>
        {showEmpty && <CommandEmpty>{noResultsText}</CommandEmpty>}

        {results.products.length > 0 && (
          <CommandGroup heading={productsLabel}>
            {results.products.map((result) => (
              <ProductResultItem
                key={result.id}
                result={result}
                locale={locale}
                onSelect={() => onSelectProduct(result.id)}
              />
            ))}
          </CommandGroup>
        )}

        {results.products.length > 0 && results.labels.length > 0 && (
          <CommandSeparator />
        )}

        {results.labels.length > 0 && (
          <CommandGroup heading={labelsLabel}>
            {results.labels.map((result) => (
              <LabelResultItem
                key={result.id}
                result={result}
                onSelect={() => onSelectLabel(result.slug!)}
              />
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </Command>
  )
}

export function WebshopSearch({ searchIndex, locale }: WebshopSearchProps) {
  const t = useTranslations('marketing.search')
  const router = useRouter()
  const [, startTransition] = useTransition()
  const mounted = useMounted()

  const [query, setQuery] = useState('')
  const [isDesktopOpen, setIsDesktopOpen] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const debouncedQuery = useDebounce(query, 150)

  const results = useMemo(() => {
    return performSearch(searchIndex, debouncedQuery, locale)
  }, [searchIndex, debouncedQuery, locale])

  const handleSelectProduct = useCallback(
    (productId: string) => {
      setQuery('')
      setIsDesktopOpen(false)
      setIsMobileOpen(false)
      startTransition(() => {
        router.push(`/sortiment/${productId}`)
      })
    },
    [router]
  )

  const handleSelectLabel = useCallback(
    (slug: string) => {
      setQuery('')
      setIsDesktopOpen(false)
      setIsMobileOpen(false)
      startTransition(() => {
        router.push(`/sortiment?label=${encodeURIComponent(slug)}`)
      })
    },
    [router]
  )

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsDesktopOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const commonProps = {
    query,
    setQuery,
    results,
    locale,
    onSelectProduct: handleSelectProduct,
    onSelectLabel: handleSelectLabel,
    placeholder: t('placeholder'),
    noResultsText: t('noResults'),
    productsLabel: t('products'),
    labelsLabel: t('labels')
  }

  // Render placeholder buttons during SSR to avoid hydration mismatch from Radix IDs
  if (!mounted) {
    return (
      <>
        {/* Desktop placeholder */}
        <div className="hidden md:block">
          <Button
            variant="outline"
            className={cn(
              'w-[220px] justify-start gap-2 bg-background/80 backdrop-blur-sm border-border/40 text-muted-foreground font-normal',
              'hover:bg-background/90 hover:text-foreground hover:border-border/60'
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('placeholder')}</span>
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
        {/* Mobile placeholder */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('openSearch')}
            className="text-foreground/90"
          >
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop: Search input with popover */}
      <div className="hidden md:block">
        <Popover open={isDesktopOpen} onOpenChange={setIsDesktopOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={isDesktopOpen}
              className={cn(
                'w-[220px] justify-start gap-2 bg-background/80 backdrop-blur-sm border-border/40 text-muted-foreground font-normal',
                'hover:bg-background/90 hover:text-foreground hover:border-border/60'
              )}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">{t('placeholder')}</span>
              <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[400px] p-0"
            align="start"
            sideOffset={8}
          >
            <SearchContent {...commonProps} />
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: Search icon that opens a sheet */}
      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          aria-label={t('openSearch')}
          className="text-foreground/90"
        >
          <Search className="h-5 w-5" />
        </Button>

        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent side="top" className="h-auto max-h-[80vh] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>{t('openSearch')}</SheetTitle>
              <SheetDescription>{t('placeholder')}</SheetDescription>
            </SheetHeader>
            <div className="p-4 pt-12">
              <SearchContent {...commonProps} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}


