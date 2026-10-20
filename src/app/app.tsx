import { lazy, Suspense, useEffect } from 'react'
import { useRoute, routeHref } from '@/app/router'
import { GithubLink } from '@/components/github-link'
import { LanguageMenu } from '@/components/language-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { InvestigationsPage } from '@/features/investigations/investigations-page'
import { useGraphStore } from '@/store/graph-store'
import { useI18n } from '@/i18n/locale'

// The graph editor (React Flow, Markdown…) is the heavy part: loaded on demand.
const InvestigationPage = lazy(() =>
  import('@/features/graph/investigation-page').then((module) => ({ default: module.InvestigationPage })),
)

export function App() {
  const { t } = useI18n()
  const route = useRoute()
  const openName = useGraphStore((state) =>
    route.name === 'investigation' && state.investigation?.id === route.id
      ? state.investigation.name.trim()
      : '',
  )

  useEffect(() => {
    document.title = openName ? `${openName} – ${t.common.brand}` : t.common.brand
  }, [openName, t])

  return (
    // Pinned to the window rather than sized in `dvh`: Chrome on iOS reports a `100dvh` taller than
    // what its bottom toolbar leaves visible, which hid the canvas controls and the detail drawer
    // under the toolbar and let the whole page scroll.
    <div className="fixed inset-0 flex flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <a
          href={routeHref({ name: 'home' })}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-6" />
          {t.common.brand}
        </a>
        <div className="flex items-center gap-1">
          <GithubLink />
          <LanguageMenu />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-auto">
        <Suspense fallback={null}>
          {route.name === 'investigation' ? (
            <InvestigationPage key={route.id} id={route.id} />
          ) : (
            <InvestigationsPage />
          )}
        </Suspense>
      </main>
    </div>
  )
}
