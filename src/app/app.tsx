import { lazy, Suspense, useEffect } from 'react'
import { useRoute, routeHref } from '@/app/router'
import { GithubLink } from '@/components/github-link'
import { ThemeToggle } from '@/components/theme-toggle'
import { InvestigationsPage } from '@/features/investigations/investigations-page'
import { useGraphStore } from '@/store/graph-store'

const BRAND = 'Filrouge'

// The graph editor (React Flow, Markdown…) is the heavy part: loaded on demand.
const InvestigationPage = lazy(() =>
  import('@/features/graph/investigation-page').then((module) => ({ default: module.InvestigationPage })),
)

export function App() {
  const route = useRoute()
  const openName = useGraphStore((state) =>
    route.name === 'investigation' && state.investigation?.id === route.id
      ? state.investigation.name.trim()
      : '',
  )

  useEffect(() => {
    document.title = openName ? `${openName} – ${BRAND}` : BRAND
  }, [openName])

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <a
          href={routeHref({ name: 'home' })}
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-6" />
          Filrouge
        </a>
        <div className="flex items-center gap-1">
          <GithubLink />
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
