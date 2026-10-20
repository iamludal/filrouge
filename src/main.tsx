import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/app'
import { Providers } from '@/app/providers'
import { detectLocale } from '@/i18n/detect'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root element missing')

// Before the first paint, so assistive technologies and hyphenation never see the wrong language.
document.documentElement.lang = detectLocale()

// The app is pinned to the window and never scrolls it. Chrome on iOS still restores a scroll offset
// on reload (the window can move by the height of its toolbar), which shifted the whole app up:
// header hidden, blank band at the bottom. Start every page show at the top instead.
history.scrollRestoration = 'manual'
window.addEventListener('pageshow', () => window.scrollTo(0, 0))

createRoot(root).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
