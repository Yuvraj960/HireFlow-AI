/**
 * HireFlow AI — RAG Service (Retrieval-Augmented Generation)
 *
 * Performs semantic search on the Question collection to retrieve relevant context
 * for the AI chat agent. Uses MongoDB Atlas $vectorSearch in production.
 *
 * LOCAL DEV FALLBACK:
 * Atlas $vectorSearch requires a free M0 Atlas cluster — it does NOT work on
 * local MongoDB instances. When NODE_ENV=development OR when Atlas search fails,
 * automatically falls back to MongoDB $text index search (localTextSearch).
 *
 * To use vector search in production:
 * 1. Deploy to MongoDB Atlas free tier (M0)
 * 2. Create a Vector Search index named "vector_index" on the `questions` collection:
 *    { fields: [{ type: "vector", path: "embedding", numDimensions: 768, similarity: "cosine" }] }
 */
import Question from '../models/Question.js'
import { generateEmbedding } from './embedding.service.js'

// ── Local Dev: Text Search Fallback ──────────────────────────────────────────
/**
 * Keyword-based text search using MongoDB $text index.
 * Used automatically when NODE_ENV=development or when Atlas $vectorSearch fails.
 *
 * Requires the text index on Question: { title: 'text', description: 'text', topic: 'text' }
 * (already defined in Question.js model)
 *
 * @param {string} queryText - Natural language query
 * @param {object} filters - Optional metadata filters { company, role, stage }
 * @param {number} limit - Max results to return
 * @returns {Promise<Array>}
 */
export const localTextSearch = async (queryText, filters = {}, limit = 10) => {
  const query = { $text: { $search: queryText } }

  if (filters.company) query.company = { $in: [new RegExp(filters.company, 'i')] }
  if (filters.role)    query.role    = { $in: [new RegExp(filters.role, 'i')] }
  if (filters.stage)   query.stage   = { $in: [filters.stage] }

  return Question.find(query, { score: { $meta: 'textScore' }, embedding: 0 })
    .sort({ score: { $meta: 'textScore' } })
    .limit(limit)
    .lean()
}

// ── Production: Atlas Vector Search ──────────────────────────────────────────
/**
 * Semantic vector search using MongoDB Atlas $vectorSearch pipeline.
 * Automatically falls back to localTextSearch() when:
 *   - NODE_ENV is 'development'
 *   - Atlas vector search returns an error (index not found, etc.)
 *
 * @param {string} queryText - Natural language query
 * @param {object} filters - Optional metadata filters { company, role, stage }
 * @param {number} limit - Max results (default 10)
 * @returns {Promise<Array>} - Ranked question documents (embedding field excluded)
 */
export const semanticSearch = async (queryText, filters = {}, limit = 10) => {
  // ── Local dev shortcut: skip Atlas, go straight to text search ──────────────
  if (process.env.NODE_ENV === 'development') {
    console.log('[RAG] Development mode — using local text search fallback')
    try {
      return await localTextSearch(queryText, filters, limit)
    } catch (err) {
      console.warn('[RAG] Local text search also failed:', err.message)
      return []
    }
  }

  // ── Production: Atlas $vectorSearch ────────────────────────────────────────
  try {
    const queryEmbedding = await generateEmbedding(queryText)

    // Build pre-filter for metadata filtering alongside vector search
    const preFilter = {}
    if (filters.company) preFilter.company = { $in: [filters.company] }
    if (filters.role)    preFilter.role    = { $in: [filters.role] }
    if (filters.stage)   preFilter.stage   = { $in: [filters.stage] }

    const pipeline = [
      {
        $vectorSearch: {
          index: 'vector_index',          // create this in Atlas UI — see top-of-file comment
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: limit * 10,      // cast a wider net for better recall
          limit,
          ...(Object.keys(preFilter).length > 0 && { filter: preFilter }),
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          company: 1,
          role: 1,
          stage: 1,
          topic: 1,
          pattern: 1,
          difficulty: 1,
          externalLink: 1,
          isInternal: 1,
          frequency: 1,
          tags: 1,
          embedding: 0,                   // never return raw embedding vectors to client
          score: { $meta: 'vectorSearchScore' },
        },
      },
      { $sort: { score: -1 } },
    ]

    return await Question.aggregate(pipeline)
  } catch (err) {
    // Atlas not available (e.g., wrong cluster tier, index not yet created)
    // Gracefully fall back to text search so the app stays functional
    const isAtlasError =
      err.message?.includes('$vectorSearch') ||
      err.message?.includes('index') ||
      err.message?.includes('Atlas') ||
      err.codeName === 'CommandNotFound'

    if (isAtlasError) {
      console.warn(
        '[RAG] Atlas $vectorSearch unavailable — falling back to text search. Error:',
        err.message
      )
      try {
        return await localTextSearch(queryText, filters, limit)
      } catch (fallbackErr) {
        console.warn('[RAG] Text search fallback also failed:', fallbackErr.message)
        return []
      }
    }

    // Unexpected error — rethrow
    throw err
  }
}
