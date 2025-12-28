import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ProductImageCutoutProps {
  src: string
  alt: string
  href?: string
  className?: string
  priority?: boolean
  sizes?: string
}

/**
 * Displays a transparent product PNG as a cutout with subtle shadow and optional blue accent.
 * Designed to take advantage of transparency - no white box container.
 */
export function ProductImageCutout({
  src,
  alt,
  href,
  className,
  priority = false,
  sizes = '(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw'
}: ProductImageCutoutProps) {
  const imageContent = (
    <div
      className={cn(
        'relative flex items-center justify-center',
        'group transition-transform duration-300 hover:scale-105',
        className
      )}
    >
      {/* Optional subtle blue accent blob behind image */}
      <div className="absolute inset-0 -z-10 rounded-full bg-primary/5 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      {/* Image with shadow */}
      <div className="relative drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
        <Image
          src={src}
          alt={alt}
          width={400}
          height={400}
          sizes={sizes}
          className="h-auto w-full max-h-[280px] object-contain"
          priority={priority}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg"
      >
        {imageContent}
      </Link>
    )
  }

  return imageContent
}

