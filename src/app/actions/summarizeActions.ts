'use server'

import {
  MIN_SUMMARY_LENGTH,
  SUMMARY_MESSAGES,
  truncateForSummary,
} from '@/utils/summary'
import { supabase } from '@/utils/supabase'

const GEMINI_MODEL = 'gemini-3.1-flash-lite'
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

const SYSTEM_INSTRUCTION =
  '당신은 메모 요약기입니다. 입력된 메모의 언어와 관계없이 항상 한국어로 2~3문장으로 핵심만 요약하세요. 요약문 외의 설명, 제목, 마크다운 서식은 출력하지 마세요.'

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[]
    }
  }[]
}

export type SummarizeResult =
  | { summary: string; error?: undefined }
  | { summary?: undefined; error: string }

export async function summarizeMemoAction(
  memoId: string,
  content: string
): Promise<SummarizeResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY가 설정되지 않았습니다.')
    return { error: SUMMARY_MESSAGES.missingKey }
  }

  if (
    typeof content !== 'string' ||
    content.trim().length < MIN_SUMMARY_LENGTH
  ) {
    return { error: SUMMARY_MESSAGES.invalidInput }
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [
          { role: 'user', parts: [{ text: truncateForSummary(content) }] },
        ],
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      }),
    })

    if (!response.ok) {
      console.error('Gemini API 오류:', response.status, await response.text())
      return {
        error:
          response.status === 429
            ? SUMMARY_MESSAGES.quotaExceeded
            : SUMMARY_MESSAGES.genericError,
      }
    }

    const data = (await response.json()) as GeminiResponse
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!summary) {
      console.error('Gemini API 응답에 요약 텍스트가 없습니다.')
      return { error: SUMMARY_MESSAGES.genericError }
    }

    const { error } = await supabase
      .from('memos')
      .update({ summary })
      .eq('id', memoId)
    if (error) console.error('요약 저장 실패:', error.message)

    return { summary }
  } catch (error) {
    console.error('요약 요청 실패:', error)
    return { error: SUMMARY_MESSAGES.genericError }
  }
}
