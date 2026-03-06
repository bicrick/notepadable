/**
 * Vercel Analytics - loaded when idle to avoid blocking initial render.
 */
function initAnalytics() {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(
      () => {
        import('@vercel/analytics').then(({ inject }) => inject())
      },
      { timeout: 2000 }
    )
  } else {
    setTimeout(() => {
      import('@vercel/analytics').then(({ inject }) => inject())
    }, 1)
  }
}

initAnalytics()
