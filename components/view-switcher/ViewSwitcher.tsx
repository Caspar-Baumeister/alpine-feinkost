'use client'

import { useTranslations } from 'next-intl'
import { LayoutDashboard, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface ViewSwitcherProps {
  currentView: 'admin' | 'worker'
  onSwitch: () => void
}

export function ViewSwitcher({ currentView, onSwitch }: ViewSwitcherProps) {
  const t = useTranslations('viewSwitch')

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={onSwitch}
          className="gap-2 hidden sm:flex"
        >
          {currentView === 'admin' ? (
            <>
              <UserCircle className="h-4 w-4" />
              <span className="hidden md:inline">{t('workerView')}</span>
            </>
          ) : (
            <>
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">{t('adminView')}</span>
            </>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {currentView === 'admin' ? t('switchToWorker') : t('switchToAdmin')}
      </TooltipContent>
    </Tooltip>
  )
}

