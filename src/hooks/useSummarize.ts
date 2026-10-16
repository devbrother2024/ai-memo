'use client'

import { useState, useCallback, useRef } from 'react'
import { summarizeMemoAction } from '@/app/actions/summarizeActions'
import { SUMMARY_MESSAGES } from '@/utils/summary'

export const useSummarize = () => {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const reset = useCallback(() => {
    requestIdRef.current += 1
    setSummary(null)
    setError(null)
    setLoading(false)
  }, [])

  const summarize = useCallback(
    async (memoId: string, content: string): Promise<string | null> => {
      const requestId = ++requestIdRef.current

      setLoading(true)
      setError(null)
      setSummary(null)

      try {
        const result = await summarizeMemoAction(memoId, content)
        if (requestId !== requestIdRef.current) return null
        if (!result.summary) {
          throw new Error(result.error || SUMMARY_MESSAGES.genericError)
        }
        setSummary(result.summary)
        return result.summary
      } catch (err) {
        if (requestId !== requestIdRef.current) return null
        console.error('요약 실패:', err)
        setError(
          err instanceof Error && err.message
            ? err.message
            : SUMMARY_MESSAGES.genericError
        )
        return null
      } finally {
        if (requestId === requestIdRef.current) setLoading(false)
      }
    },
    []
  )

  return { summary, loading, error, summarize, reset }
}
