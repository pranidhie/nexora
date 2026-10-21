# NEXORA AI-Assisted Quality Engineering

This folder contains the requirements, architecture, evaluation strategy, and implementation evidence for NEXORA's AI-assisted Quality Engineering capabilities.

## Initial Use Case

The first capability will be a Retrieval-Augmented Generation (RAG) assistant that can answer questions using approved NEXORA Quality Engineering documents.

Example questions include:

- Which test cases cover a specific requirement?
- What security risks apply to the approval workflow?
- Which critical scenarios have been automated?
- What database verification is performed for goods receipts?
- Which requirements do not have automation coverage?

## Approved Knowledge Sources

The initial knowledge base will use:

- Phase 1 Procurement Test Plan
- Test Control Workbook
- Requirements
- Test cases
- Requirements Traceability Matrix
- Security and risk documentation
- Automation README files

## Quality Requirements

The AI assistant must:

- Answer using retrieved NEXORA evidence
- Display the source documents used
- Avoid inventing requirements or test results
- State when supporting information cannot be found
- Separate facts from recommendations
- Avoid exposing credentials or environment secrets
- Produce repeatable evaluation results

## Planned Architecture

1. Document loading
2. Text extraction
3. Chunking and metadata
4. Embedding generation
5. Vector storage
6. Relevant-document retrieval
7. LLM response generation
8. Source citation
9. AI quality evaluation
10. Human review

## Evaluation Areas

The AI capability will be evaluated for:

- Retrieval relevance
- Answer correctness
- Groundedness
- Citation accuracy
- Hallucination resistance
- Prompt-injection resistance
- Response consistency
- Performance
- Security and privacy

## Implementation Roadmap

1. Define the initial AI use case
2. Prepare and sanitise source documents
3. Create the document ingestion pipeline
4. Implement chunking and metadata
5. Configure the vector database
6. Build retrieval with citations
7. Connect the language model
8. Create an AI evaluation dataset
9. Automate AI quality checks
10. Add LangGraph workflow orchestration
11. Introduce specialised QA agents
12. Integrate results into the Quality Engineering dashboard

## Current Status

- Phase 1 Quality Engineering baseline completed
- AI foundation branch created
- AI Quality Engineering documentation initiated
- RAG implementation pending