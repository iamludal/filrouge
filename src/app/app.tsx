import { useRoute, routeHref } from '@/app/router'
import { ThemeToggle } from '@/components/theme-toggle'
import { InvestigationsPage } from '@/features/investigations/investigations-page'

export function App() {
  const route = useRoute()

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <a href={routeHref({ name: 'home' })} className="font-semibold tracking-tight">
          filrouge
        </a>
        <ThemeToggle />
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-auto">
        {route.name === 'home' ? (
          <InvestigationsPage />
        ) : (
          <p className="p-6 text-muted-foreground">Éditeur de graphe à venir.</p>
        )}
      </main>
    </div>
  )
}
