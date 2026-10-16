'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import {
  clearMemosAction,
  createMemoAction,
  deleteMemoAction,
  getMemosAction,
  updateMemoAction,
} from '@/app/actions/memoActions'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드
  useEffect(() => {
    let cancelled = false
    const loadMemos = async () => {
      setLoading(true)
      try {
        const loadedMemos = await getMemosAction()
        if (!cancelled) setMemos(loadedMemos)
      } catch (error) {
        console.error('Failed to load memos:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadMemos()
    return () => {
      cancelled = true
    }
  }, [])

  // 메모 생성
  const createMemo = useCallback((formData: MemoFormData): Memo => {
    const newMemo: Memo = {
      id: uuidv4(),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 낙관적 업데이트 후 서버 저장, 실패 시 롤백
    setMemos(prev => [newMemo, ...prev])
    createMemoAction(newMemo.id, formData)
      .then(saved =>
        setMemos(prev =>
          prev.map(memo => (memo.id === saved.id ? saved : memo))
        )
      )
      .catch(error => {
        console.error('Failed to create memo:', error)
        setMemos(prev => prev.filter(memo => memo.id !== newMemo.id))
      })

    return newMemo
  }, [])

  // 메모 업데이트
  const updateMemo = useCallback(
    (id: string, formData: MemoFormData): void => {
      const existingMemo = memos.find(memo => memo.id === id)
      if (!existingMemo) return

      const updatedMemo: Memo = {
        ...existingMemo,
        ...formData,
        updatedAt: new Date().toISOString(),
      }

      setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
      updateMemoAction(id, formData)
        .then(saved =>
          setMemos(prev => prev.map(memo => (memo.id === id ? saved : memo)))
        )
        .catch(error => {
          console.error('Failed to update memo:', error)
          setMemos(prev =>
            prev.map(memo => (memo.id === id ? existingMemo : memo))
          )
        })
    },
    [memos]
  )

  // 메모 삭제
  const deleteMemo = useCallback(
    (id: string): void => {
      const target = memos.find(memo => memo.id === id)
      setMemos(prev => prev.filter(memo => memo.id !== id))
      deleteMemoAction(id).catch(error => {
        console.error('Failed to delete memo:', error)
        if (target) {
          setMemos(prev =>
            [...prev, target].sort((a, b) =>
              b.createdAt.localeCompare(a.createdAt)
            )
          )
        }
      })
    },
    [memos]
  )

  // 요약 저장 결과 반영
  const setMemoSummary = useCallback((id: string, summary: string): void => {
    setMemos(prev =>
      prev.map(memo => (memo.id === id ? { ...memo, summary } : memo))
    )
  }, [])

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제
  const clearAllMemos = useCallback((): void => {
    clearMemosAction().catch(error =>
      console.error('Failed to clear memos:', error)
    )
    setMemos([])
    setSearchQuery('')
    setSelectedCategory('all')
  }, [])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,
    setMemoSummary,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    clearAllMemos,
  }
}
