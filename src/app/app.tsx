import { ThemeToggle } from '@/components/theme-toggle'

export function App() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <span className="font-semibold tracking-tight">filrouge</span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center text-muted-foreground">
        Aucune enquête pour le moment.
      </main>
    </div>
  )
}
