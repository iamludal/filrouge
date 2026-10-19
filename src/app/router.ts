import { useSyncExternalStore } from 'react'

// Hash-based routing: works on any static host (GitHub Pages has no SPA fallback).
export type Route = { name: 'home' } | { name: 'investigation'; id: string }

const INVESTIGATION_PATTERN = /^#\/i\/([0-9a-f-]{36})$/i

export function parseRoute(hash: string): Route {
  const match = INVESTIGATION_PATTERN.exec(hash)
  return match?.[1] ? { name: 'investigation', id: match[1] } : { name: 'home' }
}

export function routeHref(route: Route): string {
  return route.name === 'investigation' ? `#/i/${route.id}` : '#/'
}

export function navigate(route: Route): void {
  window.location.hash = routeHref(route)
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parseRoute(hash)
}
