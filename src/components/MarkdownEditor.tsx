'use client'

import dynamic from 'next/dynamic'
import rehypeSanitize from 'rehype-sanitize'

// SSR 환경에서 에디터가 깨지지 않도록 클라이언트에서만 로드
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full animate-pulse rounded-lg border border-gray-300 bg-gray-50" />
  ),
})

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
}

export default function MarkdownEditor({
  value,
  onChange,
  height = 300,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light" data-testid="markdown-editor">
      <MDEditor
        value={value}
        onChange={val => onChange(val ?? '')}
        height={height}
        preview="live"
        previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
        textareaProps={{
          id: 'content',
          placeholder: '마크다운으로 메모 내용을 입력하세요',
        }}
      />
    </div>
  )
}
