interface NavigatorLike {
  platform?: string
  userAgentData?: { platform?: string }
}

/** Whether the keyboard modifier is Cmd (macOS, iOS) rather than Ctrl. */
export function isApplePlatform(nav: NavigatorLike = navigator): boolean {
  const platform = nav.userAgentData?.platform || nav.platform || ''
  return /mac|iphone|ipad|ipod/i.test(platform)
}

export type ShortcutAction = 'undo' | 'redo' | 'search'

/** The shortcut to display for an action, as written on the user's platform. */
export function shortcutLabel(action: ShortcutAction, apple: boolean): string {
  if (apple) return { undo: '⌘Z', redo: '⇧⌘Z', search: '⌘F' }[action]
  return { undo: 'Ctrl+Z', redo: 'Ctrl+Shift+Z', search: 'Ctrl+F' }[action]
}
