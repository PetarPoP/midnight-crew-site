import type { ImgHTMLAttributes } from 'react'
import optimized from '~/lib/images.json'

const SIZES = optimized as Record<string, number[]>

/**
 * <img> that serves the smaller AVIF/WebP copies made by
 * scripts/optimize-images.mjs when they exist, falling back to the original.
 * `sizes` tells the browser how wide the image is drawn, e.g. "100vw".
 */
export function Picture({ src, sizes = '100vw', ...img }: ImgHTMLAttributes<HTMLImageElement> & { src: string }) {
  const widths = SIZES[src]
  if (!widths) return <img src={src} decoding="async" {...img} />
  const base = src.replace(/^\/images\//, '/images/_opt/').replace(/\.[^.]+$/, '')
  const set = (fmt: string) => widths.map((w) => `${base}-${w}.${fmt} ${w}w`).join(', ')
  return (
    <picture className="contents">
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={set('webp')} sizes={sizes} />
      <img src={src} decoding="async" {...img} />
    </picture>
  )
}
