import Markdown, { type Components } from 'react-markdown'
import { safeUrl } from '@/lib/url'

const components: Components = {
  a: ({ href, children }) =>
    href ? (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
}

/**
 * Renders untrusted Markdown. react-markdown builds React elements (no innerHTML); raw HTML is
 * skipped and images are removed so that a note can never trigger a request to a remote server.
 */
export function SafeMarkdown({ children }: { children: string }) {
  return (
    <div className="prose-sm min-w-0 space-y-2 wrap-anywhere [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:whitespace-pre-wrap [&_ul]:list-disc [&_ul]:pl-5">
      <Markdown
        skipHtml
        disallowedElements={['img']}
        unwrapDisallowed
        urlTransform={safeUrl}
        components={components}
      >
        {children}
      </Markdown>
    </div>
  )
}
