// GA4 tracking. No-op until VITE_GA_MEASUREMENT_ID is set in a git-ignored
// .env.local (see the go-live guide in docs/). GA4 is the analytics layer the
// growth dashboard reads over OAuth — the measurement id is public, not a secret.
// ponytail: plain GA4 page_view + generic event only. Provider-branded funnel
// events belong to the checkout wiring, kept out of this neutral template.

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let started = false

export function initAnalytics() {
  if (started || !MEASUREMENT_ID || typeof window === 'undefined') return
  started = true

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  // SPA fires page_view manually on view change, so disable auto page_view.
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false })
}

export function pageview(path: string) {
  if (!MEASUREMENT_ID || typeof window.gtag !== 'function') return
  window.gtag('event', 'page_view', { page_path: path })
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!MEASUREMENT_ID || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
