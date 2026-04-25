import Question from '../models/Question.js'
import UserActivity from '../models/UserActivity.js'
import { generateEmbedding } from '../services/embedding.service.js'
import { semanticSearch } from '../services/rag.service.js'
import { sendSuccess, getPagination, paginatedResponse, createError } from '../utils/helpers.js'

/**
 * GET /api/questions
 * Get questions with optional filters: company, role, stage, topic, difficulty
 */
export const getQuestions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const { company, role, stage, topic, difficulty } = req.query

    const filter = {}
    if (company) filter.company = { $in: [new RegExp(company, 'i')] }
    if (role) filter.role = { $in: [new RegExp(role, 'i')] }
    if (stage) filter.stage = { $in: [stage] }
    if (topic) filter.topic = new RegExp(topic, 'i')
    if (difficulty) filter.difficulty = difficulty

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .lean()
        .sort({ frequency: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Question.countDocuments(filter),
    ])

    return sendSuccess(res, paginatedResponse(questions, total, page, limit))
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/questions/search?q=...&company=...&role=...&stage=...
 * Semantic vector search using Atlas $vectorSearch
 */
export const searchQuestions = async (req, res, next) => {
  try {
    const { q, company, role, stage } = req.query

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) is required.',
      })
    }

    const results = await semanticSearch(q, { company, role, stage }, 10)
    return sendSuccess(res, { questions: results, count: results.length })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/questions/:id
 */
export const getQuestion = async (req, res, next) => {
  try {
    const question = await Question.findById(req.params.id).lean()
    if (!question) throw createError('Question not found', 404)

    // Log view activity (non-blocking)
    UserActivity.create({
      userId: req.user.id,
      questionId: question._id,
      action: 'viewed',
    }).catch(() => {})

    return sendSuccess(res, { question })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/questions
 * Add new question (with auto-embedding generation)
 */
export const addQuestion = async (req, res, next) => {
  try {
    const { title, description, company, role, stage, topic, pattern,
            difficulty, externalLink, isInternal, frequency, tags } = req.body

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title and description are required.',
      })
    }

    // Generate embedding from title + description
    let embedding
    try {
      embedding = await generateEmbedding(`${title}. ${description}`)
    } catch (err) {
      console.warn('Embedding generation failed:', err.message)
    }

    const question = await Question.create({
      title, description,
      company: Array.isArray(company) ? company : company ? [company] : [],
      role: Array.isArray(role) ? role : role ? [role] : [],
      stage: Array.isArray(stage) ? stage : stage ? [stage] : [],
      topic, pattern, difficulty, externalLink, isInternal,
      frequency: frequency || 1,
      tags: tags || [],
      embedding,
    })

    return sendSuccess(res, { question }, 'Question added successfully.', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/questions/:id/activity
 * Track user activity (solved, skipped, bookmarked)
 */
export const trackActivity = async (req, res, next) => {
  try {
    const { action, timeSpent, processId } = req.body
    const validActions = ['viewed', 'solved', 'skipped', 'bookmarked']
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action.' })
    }

    const activity = await UserActivity.create({
      userId: req.user.id,
      questionId: req.params.id,
      processId,
      action,
      timeSpent: timeSpent || 0,
    })

    // Increment frequency on solve
    if (action === 'solved') {
      await Question.findByIdAndUpdate(req.params.id, { $inc: { frequency: 1 } })
    }

    return sendSuccess(res, { activity }, 'Activity tracked.')
  } catch (error) {
    next(error)
  }
}
