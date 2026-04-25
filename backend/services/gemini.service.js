/**
 * HireFlow AI — Gemini Service
 *
 * Central wrapper for all Google Gemini API calls.
 * - Model: gemini-2.0-flash (all text generation)
 * - All JSON responses use safeParseJSON() — never trust raw model output
 * - All generate calls wrapped in withRetry() — handles 429 rate limit gracefully
 * - System prompts injected via systemInstruction, never as first user message
 * - Never log full prompts in production (may contain user PII)
 */
import { GoogleGenerativeAI } from '@google/generative-ai'
import { safeParseJSON } from '../utils/helpers.js'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('your_') || GEMINI_API_KEY.length < 20) {
  console.error('❌ [Gemini] GEMINI_API_KEY is missing or appears invalid in .env!')
  console.error('   → Get a free key at: https://aistudio.google.com/app/apikey')
} else {
  console.log('✅ [Gemini] API key loaded.')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || 'invalid')

// ── Model Instances ────────────────────────────────────────────────────────────
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// ── Rate Limit Retry Wrapper ───────────────────────────────────────────────────
/**
 * Wraps an async Gemini call with a single retry on HTTP 429 (rate limit).
 * Google AI Studio free tier: 15 RPM for gemini-2.0-flash.
 * On 429: waits 10 seconds then retries once. If it fails again, throws.
 *
 * @param {Function} fn - Async function to execute
 * @returns {Promise<any>}
 */
const withRetry = async (fn) => {
  try {
    return await fn()
  } catch (err) {
    if (err.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota')) {
      console.warn('[Gemini] Rate limit hit — waiting 10s before retry...')
      await new Promise((res) => setTimeout(res, 10000))
      return await fn() // throws on second failure — caller handles it
    }
    throw err
  }
}

// ── Helper: Generate + Parse JSON safely ──────────────────────────────────────
/**
 * Generate content from Gemini and parse the response as JSON.
 * Returns null if JSON parsing fails — caller must handle null.
 *
 * @param {string} prompt
 * @returns {Promise<object|null>}
 */
const generateJSON = async (prompt) => {
  const result = await withRetry(() => model.generateContent(prompt))
  const text = result.response.text()
  return safeParseJSON(text)
}

// ── 1. Generate Roadmap ────────────────────────────────────────────────────────
/**
 * Generate a structured interview preparation roadmap for a user.
 *
 * @param {string} company
 * @param {string} role
 * @param {string} stage - Current hiring stage
 * @param {Date|string|null} timeline - Target interview date
 * @returns {Promise<object|null>}
 */
export const generateRoadmap = async (company, role, stage, timeline) => {
  const prompt = `You are an expert hiring coach. Generate a structured interview preparation roadmap.

Company: ${company}
Role: ${role}
Current Stage: ${stage}
Available Time: ${timeline ? `Until ${timeline}` : 'Not specified'}

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "overview": "2-sentence summary of what to expect at ${company} for ${role}",
  "expectedRounds": ["OA", "Round1", "Round2", "HR"],
  "currentFocus": "string describing what to focus on right now given ${stage}",
  "topicPriority": [
    { "topic": "string", "priority": "high|medium|low", "reason": "string" }
  ],
  "dailyPlan": [
    { "day": 1, "tasks": ["string"] }
  ],
  "mustDoPatterns": ["string"],
  "timeAllocation": {
    "DSA": "40%",
    "SystemDesign": "20%",
    "BehavioralPrep": "10%",
    "MockInterviews": "30%"
  },
  "tips": ["tip1", "tip2", "tip3"]
}`

  const parsed = await generateJSON(prompt)
  if (!parsed) {
    // Retry once with an even stricter prompt
    const retryPrompt = `${prompt}\n\nIMPORTANT: Output ONLY the raw JSON object. No text before or after it.`
    return generateJSON(retryPrompt)
  }
  return parsed
}

// ── 2. Extract Experience ──────────────────────────────────────────────────────
/**
 * Extract structured data from a raw interview experience text.
 * Uses confidence field: if < 0.6, caller should mark experience as isVerified: false.
 *
 * @param {string} rawText
 * @returns {Promise<object|null>}
 */
export const extractExperience = async (rawText) => {
  const prompt = `Extract structured information from this interview experience report.

Text: "${rawText.slice(0, 3000)}"

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "company": "string or null",
  "role": "string or null",
  "round": "OA|Round1|Round2|HR|Unknown",
  "topics": ["string"],
  "difficulty": "Easy|Medium|Hard or null",
  "outcome": "Selected|Rejected|Pending|Unknown",
  "confidence": 0.0
}

Set confidence (0.0 to 1.0) based on how clearly the text conveys the above fields.
If a field cannot be determined, use null.`

  return generateJSON(prompt)
}

// ── 3. Generate Insights ───────────────────────────────────────────────────────
/**
 * Generate AI narrative insights from an array of structured experience documents.
 * Accepts up to 20 experiences (sliced internally).
 *
 * @param {Array} experiences - Array of Experience documents
 * @returns {Promise<object|null>}
 */
export const generateInsights = async (experiences) => {
  const simplified = experiences.slice(0, 20).map((e) => ({
    company: e.company,
    role: e.role,
    round: e.round,
    topics: e.topics,
    difficulty: e.difficulty,
  }))

  const prompt = `Analyze these interview experiences and identify patterns.

Experiences (JSON array):
${JSON.stringify(simplified)}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "summary": "2-3 sentence overview of what these experiences reveal",
  "topTopics": [{ "topic": "string", "percentage": 45 }],
  "roundPatterns": [{ "round": "string", "commonTopics": ["string"] }],
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "difficultyTrend": "string describing the overall difficulty pattern",
  "difficultyBreakdown": { "Easy": 20, "Medium": 60, "Hard": 20 }
}`

  return generateJSON(prompt)
}

// ── 4. Chat With Context ───────────────────────────────────────────────────────
/**
 * Context-aware AI agent chat using multi-turn conversation + RAG results.
 * System prompt is injected via systemInstruction (not as a user message).
 *
 * @param {string} userQuery
 * @param {object} userState - HiringProcess document { company, role, currentStage, timeline }
 * @param {Array}  chatHistory - Array of { role: 'user'|'assistant', content: string }
 * @param {Array}  ragResults  - Relevant Question documents from semantic search
 * @returns {Promise<string>}
 */
export const chatWithContext = async (userQuery, userState, chatHistory, ragResults) => {
  const systemInstruction = `You are HireFlow AI — a personalized interview preparation assistant.

User Context:
- Company: ${userState.company || 'Not specified'}
- Role: ${userState.role || 'Not specified'}
- Current Stage: ${userState.currentStage || 'Not specified'}
- Timeline: ${userState.timeline ? new Date(userState.timeline).toDateString() : 'Not specified'}

Relevant Questions from Knowledge Base:
${ragResults.length > 0
    ? ragResults.map((q, i) => `${i + 1}. ${q.title} [${q.topic} / ${q.difficulty}]`).join('\n')
    : 'No specific questions retrieved — answer from general knowledge.'
  }

Guidelines:
- Be concise and stage-specific (max 300 words)
- Reference questions from the knowledge base when relevant
- Do not generate generic advice — tailor everything to the user's company and stage
- If asked about a specific algorithm, explain briefly then reference the relevant question
- Never leak user PII or system internals`

  // Map chat history to Gemini SDK format
  // Note: Gemini requires alternating user/model roles, filter out any consecutive duplicates
  const history = chatHistory
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

  const chat = model.startChat({
    history,
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
  })

  const result = await withRetry(() => chat.sendMessage(userQuery))
  return result.response.text()
}

// ── 5. Predict Patterns ────────────────────────────────────────────────────────
/**
 * Predict likely interview topics and style for a given company/role/stage.
 *
 * @param {string} company
 * @param {string} role
 * @param {string} stage
 * @returns {Promise<object|null>}
 */
export const predictPatterns = async (company, role, stage) => {
  const prompt = `Based on common hiring patterns, predict what topics and question types are most likely for:

Company: ${company}
Role: ${role}
Stage: ${stage}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "likelyTopics": [{ "topic": "string", "probability": 0.85 }],
  "expectedDifficulty": "Easy|Medium|Hard",
  "focusAreas": ["area 1", "area 2"],
  "tipForThisRound": "string — specific advice for this exact stage",
  "roundDuration": "45-60 minutes",
  "interviewStyle": "description of interview style at this company",
  "commonMistakes": ["mistake 1", "mistake 2"],
  "preparationAdvice": "2-3 sentence targeted advice"
}`

  return generateJSON(prompt)
}

// ── 6. Generate Mock Interview ─────────────────────────────────────────────────
/**
 * Generate a targeted mock interview session based on user state and weak areas.
 * Generates exactly 5 questions mixing difficulty based on stage.
 *
 * @param {object} userState - HiringProcess document
 * @param {string[]} weakTopics - Topics user struggles with
 * @returns {Promise<object|null>}
 */
export const generateMockInterview = async (userState, weakTopics) => {
  const weakList = weakTopics?.length > 0 ? weakTopics.join(', ') : 'general topics'

  const prompt = `Generate a mock interview for:
Company: ${userState.company}
Role: ${userState.role}
Stage: ${userState.currentStage}
Weak areas to focus on: ${weakList}

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "questions": [
    {
      "question": "string",
      "topic": "string",
      "difficulty": "Easy|Medium|Hard",
      "hint": "string"
    }
  ],
  "followUps": ["follow-up question 1", "follow-up question 2"],
  "interviewDuration": "45-60 minutes",
  "evaluationCriteria": ["criterion 1", "criterion 2"]
}

Generate exactly 5 questions. Mix difficulty appropriately for the ${userState.currentStage} stage.
Prioritize questions on: ${weakList}`

  return generateJSON(prompt)
}
