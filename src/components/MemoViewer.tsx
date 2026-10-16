'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'
import { useSummarize } from '@/hooks/useSummarize'
import { MIN_SUMMARY_LENGTH, SUMMARY_MESSAGES } from '@/utils/summary'
import MarkdownViewer from './MarkdownViewer'

interface MemoViewerProps {
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onSummarized?: (id: string, summary: string) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  personal: 'bg-blue-100 text-blue-800',
  work: 'bg-green-100 text-green-800',
  study: 'bg-purple-100 text-purple-800',
  idea: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function MemoViewer({
  memo,
  onClose,
  onEdit,
  onDelete,
  onSummarized,
}: MemoViewerProps) {
  const isOpen = memo !== null
  const memoId = memo?.id
  const memoContent = memo?.content ?? ''
  const {
    summary: generatedSummary,
    loading,
    error,
    summarize,
    reset,
  } = useSummarize()
  const summary = generatedSummary ?? memo?.summary ?? null

  const canSummarize = useMemo(
    () => memoContent.trim().length >= MIN_SUMMARY_LENGTH,
    [memoContent]
  )

  useEffect(() => {
    reset()
  }, [memoId, reset])

  const handleSummarize = useCallback(async () => {
    if (!memoId) return
    const result = await summarize(memoId, memoContent)
    if (result) onSummarized?.(memoId, result)
  }, [summarize, memoId, memoContent, onSummarized])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleDelete = useCallback(() => {
    if (memo && window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }, [memo, onDelete, onClose])

  if (!memo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      data-testid="memo-viewer-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-viewer-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
        data-testid="memo-viewer"
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between border-b border-gray-200 p-6">
          <div className="flex-1">
            <h2
              id="memo-viewer-title"
              className="mb-2 break-words text-xl font-semibold text-gray-900"
            >
              {memo.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${CATEGORY_COLORS[memo.category] || CATEGORY_COLORS.other}`}
              >
                {MEMO_CATEGORIES[
                  memo.category as keyof typeof MEMO_CATEGORIES
                ] || memo.category}
              </span>
              <span className="text-xs text-gray-500">
                수정: {formatDate(memo.updatedAt)}
              </span>
              <span className="text-xs text-gray-500">
                작성: {formatDate(memo.createdAt)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="ml-4 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            data-testid="memo-viewer-close-btn"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-blue-900">
                {SUMMARY_MESSAGES.title}
              </span>
              {!error && (
                <button
                  onClick={handleSummarize}
                  disabled={!canSummarize || loading}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  data-testid="memo-summarize-btn"
                >
                  {loading ? SUMMARY_MESSAGES.loading : SUMMARY_MESSAGES.button}
                </button>
              )}
            </div>
            {!canSummarize && (
              <p className="mt-2 text-xs text-gray-500">
                {SUMMARY_MESSAGES.tooShort}
              </p>
            )}
            {summary && (
              <p
                className="mt-3 whitespace-pre-wrap text-sm text-gray-700"
                data-testid="memo-summary-result"
              >
                {summary}
              </p>
            )}
            {error && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <p
                  className="text-sm text-red-600"
                  role="alert"
                  data-testid="memo-summary-error"
                >
                  {error}
                </p>
                <button
                  onClick={handleSummarize}
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
                  data-testid="memo-summary-retry-btn"
                >
                  {SUMMARY_MESSAGES.retry}
                </button>
              </div>
            )}
          </div>
          <MarkdownViewer source={memo.content} />
          {memo.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 액션 */}
        <div className="flex justify-end gap-2 border-t border-gray-200 p-4">
          <button
            onClick={() => onEdit(memo)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            data-testid="memo-viewer-edit-btn"
          >
            편집
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            data-testid="memo-viewer-delete-btn"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}
