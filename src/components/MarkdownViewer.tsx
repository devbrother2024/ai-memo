'use client'

import dynamic from 'next/dynamic'
import rehypeSanitize from 'rehype-sanitize'

const Markdown = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default.Markdown),
  { ssr: false }
)

interface MarkdownViewerProps {
  source: string
}

export default function MarkdownViewer({ source }: MarkdownViewerProps) {
  return (
    <div data-color-mode="light" data-testid="markdown-viewer">
      <Markdown
        source={source}
        rehypePlugins={[[rehypeSanitize]]}
        components={{
          // 외부 링크는 새 탭으로 열어 앱 화면을 벗어나지 않도록 함
          a: ({ href, className, children }) => {
            const isExternal = /^https?:/.test(href ?? '')
            return (
              <a
                href={href}
                className={className}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            )
          },
        }}
        style={{ background: 'transparent', fontSize: '0.875rem' }}
      />
    </div>
  )
}
