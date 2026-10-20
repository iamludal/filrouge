/// <reference types="node" />
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { Blob as NodeBlob } from 'node:buffer'
import { afterEach, beforeEach } from 'vitest'
import { resetViewport } from './viewport'

// fake-indexeddb clones values with Node's structuredClone, which turns jsdom's Blob into a plain
// object. Node's own Blob survives the round trip and supports arrayBuffer().
globalThis.Blob = NodeBlob as unknown as typeof Blob

// Vitest's createObjectURL only understands jsdom's Blob; object URLs are not read in tests.
let objectUrls = 0
URL.createObjectURL = () => `blob:filrouge-test/${++objectUrls}`
URL.revokeObjectURL = () => {}

// jsdom lacks matchMedia and ResizeObserver, both used by the UI.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Radix Select relies on pointer capture and scrollIntoView, which jsdom does not implement.
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

// A test that mocked the viewport never leaks it into the next one.
afterEach(resetViewport)

// The suites assert on French texts: every test starts with French stored as the chosen language.
// English is covered explicitly, with `renderWithLocale`.
beforeEach(() => {
  try {
    localStorage.setItem('filrouge:locale', 'fr')
  } catch {
    // storage mocked to throw by the test itself
  }
})
