'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type FormLanguageToggleProps = {
  value: 'de' | 'en'
  onChange: (language: 'de' | 'en') => void
  className?: string
}

export function FormLanguageToggle({ value, onChange, className }: FormLanguageToggleProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(val) => onChange((val || 'de') as 'de' | 'en')}
      className={cn('w-fit', className)}
    >
      <TabsList className="grid grid-cols-2">
        <TabsTrigger value="de">DE</TabsTrigger>
        <TabsTrigger value="en">EN</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

