'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { useEffect } from 'react'

/**
 * Forces light mode for public webshop pages.
 * Sets the theme via the root ThemeProvider context.
 * The wrapper div forces light class to prevent any dark mode flash.
 */
export function LightThemeProvider({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme('light')
  }, [setTheme])

  // Force light class on wrapper to ensure light theme regardless of system preference
  return (
    <div className={`light ${className ?? ''}`} style={{ colorScheme: 'light' }}>
      {children}
    </div>
  )
}

