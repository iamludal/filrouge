const EDITABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

/** True while the user types in a field: iOS may then move the window to show it above the keyboard. */
function isEditing(doc: Document): boolean {
  return doc.activeElement instanceof Element && doc.activeElement.matches(EDITABLE)
}

/**
 * Keeps the window at its top. The app is pinned to the window and never scrolls it, yet iOS
 * browsers move it anyway: Chrome restores a scroll offset on reload, and a page loaded while the
 * keyboard closes (typing a URL and pressing Enter) keeps the keyboard's shift. Either way the
 * whole app slides up, header hidden and a blank band at the bottom. The window is put back at the
 * top whenever it moves, except while a field is being edited.
 */
export function pinWindowScroll(win: Window = window): () => void {
  win.history.scrollRestoration = 'manual'
  const reset = () => {
    if ((win.scrollX !== 0 || win.scrollY !== 0) && !isEditing(win.document)) win.scrollTo(0, 0)
  }
  // While focus moves, the active element is the body: check once it has landed on the next field.
  const resetAfterBlur = () => win.setTimeout(reset, 0)
  win.addEventListener('pageshow', reset)
  win.addEventListener('scroll', reset)
  // The keyboard closing resizes the visual viewport, and leaving a field ends the editing.
  win.visualViewport?.addEventListener('resize', reset)
  win.document.addEventListener('focusout', resetAfterBlur)
  return () => {
    win.removeEventListener('pageshow', reset)
    win.removeEventListener('scroll', reset)
    win.visualViewport?.removeEventListener('resize', reset)
    win.document.removeEventListener('focusout', resetAfterBlur)
  }
}
