/**
 * HireFlow AI — Embedding Service
 *
 * Generates vector embeddings using Google text-embedding-004 model.
 * Output: 768-dimensional float arrays for MongoDB Atlas Vector Search.
 *
 * Rate limit: 100 RPM on Google AI Studio free tier.
 * Use embedInBatches() when processing more than 10 items.
 */
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// text-embedding-004 outputs 768-dimensional vectors — use for ALL embeddings
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })

/**
 * Generate a single vector embedding for the given text.
 * Input text is trimmed and capped at 2000 characters to stay within token limits.
 *
 * Embed questions at creation time, storing in Question.embedding.
 * Embed user queries at search time — never cache user query embeddings.
 * Recommended input format: `"${question.title} ${question.description} ${question.topic}"`
 *
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - 768-dimensional float array
 */
export const generateEmbedding = async (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Invalid text provided for embedding generation.')
  }

  const result = await embeddingModel.embedContent(text.trim().slice(0, 2000))
  return result.embedding.values
}

/**
 * Batch-embed an array of question documents to avoid API rate limits.
 * Processes questions in batches of `batchSize` with a 1-second pause between batches.
 *
 * Each question must have: title, description, topic (for embedding text composition).
 * The `.embedding` field is set on each document and the document is saved.
 *
 * Google AI Studio free tier: 100 RPM for text-embedding-004.
 * With batchSize=10 and 1s pause, this stays well within limits.
 *
 * @param {Array} questions - Array of Mongoose documents (must have .save())
 * @param {number} [batchSize=10] - Max embeddings to generate per batch
 * @returns {Promise<void>}
 */
export const embedInBatches = async (questions, batchSize = 10) => {
  const total = questions.length
  let succeeded = 0
  let failed = 0

  for (let i = 0; i < total; i += batchSize) {
    const batch = questions.slice(i, i + batchSize)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(total / batchSize)

    console.log(`\n📦 Embedding batch ${batchNum}/${totalBatches} (${batch.length} questions)...`)

    await Promise.all(
      batch.map(async (q) => {
        try {
          // Compose embedding text: title + description + topic (per ai.md spec)
          const embeddingText = [q.title, q.description, q.topic]
            .filter(Boolean)
            .join(' ')

          q.embedding = await generateEmbedding(embeddingText)
          await q.save()
          succeeded++
          console.log(`  ✅ Embedded: ${q.title}`)
        } catch (err) {
          failed++
          console.warn(`  ⚠️  Failed to embed "${q.title}": ${err.message}`)
        }
      })
    )

    // 1-second pause between batches to respect rate limits
    if (i + batchSize < total) {
      console.log(`  ⏳ Pausing 1s before next batch...`)
      await new Promise((res) => setTimeout(res, 1000))
    }
  }

  console.log(`\n📊 Embedding complete: ${succeeded} succeeded, ${failed} failed out of ${total} total.`)
}
