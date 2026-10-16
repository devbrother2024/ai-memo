'use server'

import { Memo, MemoFormData } from '@/types/memo'
import { supabase } from '@/utils/supabase'

interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  summary: string | null
  created_at: string
  updated_at: string
}

const toMemo = (row: MemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags,
  summary: row.summary,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export async function getMemosAction(): Promise<Memo[]> {
  const { data, error } = await supabase
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as MemoRow[]).map(toMemo)
}

export async function createMemoAction(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .insert({ id, ...formData })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toMemo(data as MemoRow)
}

export async function updateMemoAction(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const { data, error } = await supabase
    .from('memos')
    .update({ ...formData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return toMemo(data as MemoRow)
}

export async function deleteMemoAction(id: string): Promise<void> {
  const { error } = await supabase.from('memos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function clearMemosAction(): Promise<void> {
  const { error } = await supabase
    .from('memos')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw new Error(error.message)
}
