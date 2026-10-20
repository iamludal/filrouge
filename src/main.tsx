import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/app'
import { Providers } from '@/app/providers'
import { pinWindowScroll } from '@/app/window-scroll'
import { detectLocale } from '@/i18n/detect'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('#root element missing')

// Before the first paint, so assistive technologies and hyphenation never see the wrong language.
document.documentElement.lang = detectLocale()

pinWindowScroll()

createRoot(root).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
