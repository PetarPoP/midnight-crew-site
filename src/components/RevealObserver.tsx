import { useEffect } from 'react'

/** Marks every [data-reveal] element with data-in once it scrolls into view. */
export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute('data-in', '')
            io.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    )
    const watch = (root: ParentNode) =>
      root.querySelectorAll('[data-reveal]:not([data-in])').forEach((el) => io.observe(el))

    watch(document)
    // Pick up elements added later (route changes, filtered lists).
    const mo = new MutationObserver((muts) => {
      for (const m of muts)
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return
          if (n.matches('[data-reveal]:not([data-in])')) io.observe(n)
          watch(n)
        })
    })
    mo.observe(document.body, { childList: true, subtree: true })
    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])
  return null
}
