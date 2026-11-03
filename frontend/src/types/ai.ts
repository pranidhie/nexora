export type AIAnswerStatus =
  | 'answer'
  | 'insufficient_evidence'
  | 'refuse'

export type AIQuestionRequest = {
  query: string
}

export type AIAnswerCitation = {
  source_id: string
  chunk_id: string
  section: string
  locator: string
  excerpt: string
}

export type AIAnswerResponse = {
  query: string
  status: AIAnswerStatus
  answer: string
  citations: AIAnswerCitation[]
  reason: string | null
}