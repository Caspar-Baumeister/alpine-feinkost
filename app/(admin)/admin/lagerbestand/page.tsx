'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2, Check, Tag } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { LagerbestandTable } from './LagerbestandTable'
import { listProducts, listLabels, Product, Label } from '@/lib/firestore'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function LagerbestandPage() {
  const t = useTranslations('lagerbestand')
  const [products, setProducts] = useState<Product[]>([])
  const [labels, setLabels] = useState<Label[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [labelFilter, setLabelFilter] = useState<string[]>([])
  const [search, setSearch] = useState<string>('')

  const loadProducts = async () => {
    try {
      const [productsData, labelsData] = await Promise.all([
        listProducts(),
        listLabels()
      ])
      setProducts(productsData)
      setLabels(labelsData)
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filteredProducts = products
    .filter((p) => {
      if (labelFilter.length === 0) return true
      return labelFilter.every((id) => (p.labels || []).includes(id))
    })
    .filter((p) => {
      if (!search.trim()) return true
      const term = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.sku && p.sku.toLowerCase().includes(term))
      )
    })

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-64 justify-between">
                <span className="flex gap-2 flex-wrap items-center text-left">
                  {labelFilter.length === 0
                    ? t('filters.allLabels')
                    : labelFilter.map((id) => {
                        const lbl = labels.find((l) => l.id === id)
                        return (
                          <span key={id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                            <Tag className="h-3 w-3" />
                            {lbl?.name || id}
                          </span>
                        )
                      })}
                </span>
                <Check className="h-4 w-4 opacity-70" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-0" align="start">
              <Command>
                <CommandInput placeholder={t('filters.searchLabels')} />
                <CommandList>
                  <CommandEmpty>{t('filters.noLabels')}</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => setLabelFilter([])}>
                      <Check className={cn('mr-2 h-4 w-4', labelFilter.length === 0 ? 'opacity-100' : 'opacity-0')} />
                      {t('filters.allLabels')}
                    </CommandItem>
                    {labels.map((label) => {
                      const selected = labelFilter.includes(label.id)
                      return (
                        <CommandItem
                          key={label.id}
                          onSelect={() =>
                            setLabelFilter((prev) =>
                              prev.includes(label.id)
                                ? prev.filter((l) => l !== label.id)
                                : [...prev, label.id]
                            )
                          }
                        >
                          <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                          {label.name}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('filters.search')}
            className="w-full sm:max-w-xs"
          />
        </div>
      </div>
      <LagerbestandTable products={filteredProducts} onDataChange={loadProducts} />
    </div>
  )
}
