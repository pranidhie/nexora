import { apiClient } from './client'

import type {
  AIAnswerResponse,
  AIQuestionRequest,
} from '../types/ai'


export const MAX_AI_QUERY_CHARACTERS = 1_000


type ValidationErrorDetail = {
  msg?: string
}


type APIErrorResponse = {
  detail?:
    | string
    | ValidationErrorDetail[]
}


export class AIAPIError extends Error {
  readonly status: number

  constructor(
    status: number,
    message: string,
  ) {
    super(message)

    this.name = 'AIAPIError'
    this.status = status
  }
}


const getErrorMessage = async (
  response: Response,
): Promise<string> => {
  let errorBody: APIErrorResponse = {}

  try {
    errorBody = (
      await response.json()
    ) as APIErrorResponse
  } catch {
    return (
      `AI request failed with HTTP `
      + `${response.status}.`
    )
  }

  if (
    typeof errorBody.detail === 'string'
    && errorBody.detail.trim()
  ) {
    return errorBody.detail
  }

  if (Array.isArray(errorBody.detail)) {
    const validationMessages = (
      errorBody.detail
        .map((item) => item.msg)
        .filter(
          (message): message is string =>
            Boolean(message),
        )
    )

    if (validationMessages.length > 0) {
      return validationMessages.join(' ')
    }
  }

  return (
    `AI request failed with HTTP `
    + `${response.status}.`
  )
}


export const askAIQuestion = async (
  query: string,
): Promise<AIAnswerResponse> => {
  const payload: AIQuestionRequest = {
    query: query.trim(),
  }

  const response = await apiClient(
    '/api/v1/ai/ask',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  if (!response.ok) {
    throw new AIAPIError(
      response.status,
      await getErrorMessage(response),
    )
  }

  return (
    await response.json()
  ) as AIAnswerResponse
}