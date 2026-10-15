import type { Product } from '~/lib/data'

/** Product photo slot. Shows a placeholder until real photos are added. */
export function ProductPhoto({ product }: { product: Product }) {
  return (
    <div className="aspect-[16/11] overflow-hidden bg-panel-2 p-px">
      <div className="flex size-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-white/25 font-sans text-[13px] text-white/60 transition-transform duration-500 group-hover:scale-105">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
        </svg>
        {product.placeholder}
      </div>
    </div>
  )
}
