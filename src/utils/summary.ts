export const MIN_SUMMARY_LENGTH = 50
export const MAX_SUMMARY_INPUT_LENGTH = 8000

export const SUMMARY_MESSAGES = {
  button: 'AI 요약',
  loading: '요약 중...',
  retry: '다시 시도',
  title: 'AI 요약',
  tooShort: `${MIN_SUMMARY_LENGTH}자 이상 메모만 요약할 수 있습니다`,
  genericError: '요약을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  missingKey: '서버에 API 키가 설정되지 않았습니다.',
  quotaExceeded: '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
  invalidInput: '요약할 수 없는 메모입니다.',
} as const

export const truncateForSummary = (content: string): string =>
  content.length > MAX_SUMMARY_INPUT_LENGTH
    ? content.slice(0, MAX_SUMMARY_INPUT_LENGTH)
    : content
