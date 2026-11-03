import {
  useState,
} from 'react'

import type {
  FormEvent,
} from 'react'

import {
  AIAPIError,
  MAX_AI_QUERY_CHARACTERS,
  askAIQuestion,
} from '../../api/aiapi'

import type {
  AIAnswerResponse,
  AIAnswerStatus,
} from '../../types/ai'

import './AIQualityAssistantPage.css'


const suggestedQuestions = [
  'How many traceable requirements are included in the NEXORA Phase 1 test design baseline?',
  'What automated execution results are recorded for API, data-layer, and Chromium UI testing?',
  'What database verification is included in the Phase 1 automation baseline?',
  'What goods receipt and inventory scenarios are automated?',
]


function getStatusLabel(
  status: AIAnswerStatus,
) {
  switch (status) {
    case 'answer':
      return 'Grounded answer'

    case 'insufficient_evidence':
      return 'Insufficient evidence'

    case 'refuse':
      return 'Request refused'

    default:
      return 'Unknown status'
  }
}


function AIQualityAssistantPage() {
  const [
    query,
    setQuery,
  ] = useState('')

  const [
    result,
    setResult,
  ] =
    useState<AIAnswerResponse | null>(
      null,
    )

  const [
    error,
    setError,
  ] = useState('')

  const [
    isLoading,
    setIsLoading,
  ] = useState(false)


  const submitQuestion =
    async (
      question: string,
    ) => {
      const normalisedQuestion =
        question.trim()

      if (!normalisedQuestion) {
        setError(
          'Enter a quality-engineering question.',
        )

        return
      }

      if (
        normalisedQuestion.length >
        MAX_AI_QUERY_CHARACTERS
      ) {
        setError(
          `The question must not exceed ${MAX_AI_QUERY_CHARACTERS} characters.`,
        )

        return
      }

      try {
        setIsLoading(true)
        setError('')
        setResult(null)

        const response =
          await askAIQuestion(
            normalisedQuestion,
          )

        setResult(response)
      } catch (
        requestError
      ) {
        if (
          requestError instanceof
          AIAPIError
        ) {
          if (
            requestError.status ===
            401
          ) {
            setError(
              'Your login session is no longer valid. Sign out and sign in again.',
            )

            return
          }

          if (
            requestError.status ===
            503
          ) {
            setError(
              'The local AI provider is unavailable. Confirm that Ollama is running and try again.',
            )

            return
          }

          setError(
            requestError.message,
          )

          return
        }

        setError(
          'The AI Quality Assistant could not complete the request.',
        )
      } finally {
        setIsLoading(false)
      }
    }


  const handleSubmit =
    (
      event:
        FormEvent<HTMLFormElement>,
    ) => {
      event.preventDefault()

      void submitQuestion(
        query,
      )
    }


  const handleSuggestedQuestion =
    (
      question: string,
    ) => {
      setQuery(question)

      void submitQuestion(
        question,
      )
    }


  return (
    <section
      className="ai-assistant-page"
      data-testid="ai-assistant-page"
    >
      <header className="ai-assistant-hero">
        <div className="ai-assistant-hero-copy">
          <p className="ai-assistant-eyebrow">
            NEXORA AI QUALITY ENGINEERING
          </p>

          <h1>
            Ask questions. Verify the evidence.
          </h1>

          <p>
            Explore approved NEXORA requirements,
            test evidence and quality records through
            a controlled Retrieval-Augmented
            Generation workflow.
          </p>
        </div>

        <div
          className="ai-assistant-trust-card"
          aria-label="AI answer controls"
        >
          <span className="ai-assistant-trust-icon">
            AI
          </span>

          <div>
            <strong>
              Evidence-controlled answers
            </strong>

            <span>
              Local AI • Approved sources • Traceable citations
            </span>
          </div>
        </div>
      </header>


      <div className="ai-assistant-grid">
        <div className="ai-assistant-question-panel">
          <div className="ai-assistant-panel-heading">
            <div>
              <p className="ai-assistant-section-label">
                QUALITY QUESTION
              </p>

              <h2>
                What would you like to investigate?
              </h2>
            </div>

            <span className="ai-assistant-secure-badge">
              Protected
            </span>
          </div>


          <form
            className="ai-assistant-form"
            onSubmit={
              handleSubmit
            }
          >
            <label htmlFor="ai-quality-question">
              Ask about requirements, automation,
              APIs, databases or ERP quality evidence
            </label>

            <textarea
              id="ai-quality-question"
              data-testid="ai-question-input"
              value={
                query
              }
              maxLength={
                MAX_AI_QUERY_CHARACTERS
              }
              placeholder="For example: How many traceable requirements are included in the Phase 1 baseline?"
              onChange={
                (
                  event,
                ) => {
                  setQuery(
                    event.target.value,
                  )

                  if (error) {
                    setError('')
                  }
                }
              }
            />

            <div className="ai-assistant-form-footer">
              <span>
                {query.length} / {MAX_AI_QUERY_CHARACTERS}
              </span>

              <button
                type="submit"
                className="ai-assistant-submit"
                data-testid="ai-question-submit"
                disabled={
                  isLoading ||
                  !query.trim()
                }
              >
                {
                  isLoading
                    ? 'Analysing evidence…'
                    : 'Ask NEXORA AI'
                }
              </button>
            </div>
          </form>


          <div className="ai-assistant-suggestions">
            <p>
              Suggested questions
            </p>

            <div className="ai-assistant-suggestion-list">
              {suggestedQuestions.map(
                (
                  question,
                ) => (
                  <button
                    key={
                      question
                    }
                    type="button"
                    onClick={
                      () =>
                        handleSuggestedQuestion(
                          question,
                        )
                    }
                    disabled={
                      isLoading
                    }
                  >
                    {question}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>


        <aside className="ai-assistant-information-panel">
          <p className="ai-assistant-section-label">
            HOW IT WORKS
          </p>

          <h2>
            Grounded quality intelligence
          </h2>

          <ol className="ai-assistant-process-list">
            <li>
              <span>
                1
              </span>

              <div>
                <strong>
                  Query protection
                </strong>

                <p>
                  The request is checked before it
                  enters the answer workflow.
                </p>
              </div>
            </li>

            <li>
              <span>
                2
              </span>

              <div>
                <strong>
                  Approved retrieval
                </strong>

                <p>
                  Relevant evidence is retrieved only
                  from controlled NEXORA sources.
                </p>
              </div>
            </li>

            <li>
              <span>
                3
              </span>

              <div>
                <strong>
                  Grounded generation
                </strong>

                <p>
                  The local Ollama model answers using
                  the supplied evidence.
                </p>
              </div>
            </li>

            <li>
              <span>
                4
              </span>

              <div>
                <strong>
                  Citation validation
                </strong>

                <p>
                  Every grounded answer must reference
                  an approved knowledge chunk.
                </p>
              </div>
            </li>
          </ol>

          <div className="ai-assistant-policy-note">
            <strong>
              Answer policy
            </strong>

            <p>
              If the approved evidence cannot confirm
              an answer, NEXORA returns an insufficient
              evidence result instead of inventing one.
            </p>
          </div>
        </aside>
      </div>


      {error && (
        <div
          className="ai-assistant-error"
          role="alert"
          data-testid="ai-answer-error"
        >
          <strong>
            Unable to complete the request
          </strong>

          <p>
            {error}
          </p>
        </div>
      )}


      {isLoading && (
        <div
          className="ai-assistant-loading"
          role="status"
          data-testid="ai-answer-loading"
        >
          <span className="ai-assistant-loading-spinner" />

          <div>
            <strong>
              Analysing approved evidence
            </strong>

            <p>
              NEXORA is retrieving and validating
              relevant quality information.
            </p>
          </div>
        </div>
      )}


      {result && !isLoading && (
        <section
          className="ai-assistant-result"
          data-testid="ai-answer-result"
        >
          <div className="ai-assistant-result-header">
            <div>
              <p className="ai-assistant-section-label">
                NEXORA RESPONSE
              </p>

              <h2>
                Quality intelligence result
              </h2>
            </div>

            <span
              className={
                `ai-assistant-status ai-assistant-status-${result.status}`
              }
              data-testid="ai-answer-status"
            >
              {getStatusLabel(
                result.status,
              )}
            </span>
          </div>


          <div className="ai-assistant-query-summary">
            <span>
              Question
            </span>

            <p>
              {result.query}
            </p>
          </div>


          <article className="ai-assistant-answer-card">
            <div className="ai-assistant-answer-icon">
              AI
            </div>

            <div>
              <h3>
                Answer
              </h3>

              <p data-testid="ai-answer-text">
                {result.answer}
              </p>
            </div>
          </article>


          {result.reason && (
            <div className="ai-assistant-reason">
              <strong>
                Validation note
              </strong>

              <p>
                {result.reason}
              </p>
            </div>
          )}


          {result.citations.length > 0 && (
            <div className="ai-assistant-citations">
              <div className="ai-assistant-citations-heading">
                <div>
                  <p className="ai-assistant-section-label">
                    SUPPORTING EVIDENCE
                  </p>

                  <h3>
                    Verified citations
                  </h3>
                </div>

                <span>
                  {result.citations.length}
                  {' '}
                  {
                    result.citations.length === 1
                      ? 'source'
                      : 'sources'
                  }
                </span>
              </div>


              <div className="ai-assistant-citation-list">
                {result.citations.map(
                  (
                    citation,
                    index,
                  ) => (
                    <details
                      key={
                        citation.chunk_id
                      }
                      className="ai-assistant-citation"
                      open={
                        index === 0
                      }
                    >
                      <summary>
                        <span className="ai-assistant-citation-number">
                          {index + 1}
                        </span>

                        <span className="ai-assistant-citation-summary">
                          <strong>
                            {citation.section}
                          </strong>

                          <small>
                            {citation.source_id}
                          </small>
                        </span>

                        <span className="ai-assistant-citation-action">
                          Evidence
                        </span>
                      </summary>

                      <div className="ai-assistant-citation-content">
                        <dl>
                          <div>
                            <dt>
                              Source ID
                            </dt>

                            <dd>
                              {citation.source_id}
                            </dd>
                          </div>

                          <div>
                            <dt>
                              Chunk ID
                            </dt>

                            <dd>
                              {citation.chunk_id}
                            </dd>
                          </div>

                          <div>
                            <dt>
                              Locator
                            </dt>

                            <dd>
                              {citation.locator}
                            </dd>
                          </div>
                        </dl>

                        <blockquote>
                          {citation.excerpt}
                        </blockquote>
                      </div>
                    </details>
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </section>
  )
}


export default AIQualityAssistantPage