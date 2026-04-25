import HiringProcess from '../models/HiringProcess.js'
import ChatMessage from '../models/ChatMessage.js'
import { chatWithContext, generateMockInterview } from '../services/gemini.service.js'
import { semanticSearch } from '../services/rag.service.js'
import { sendSuccess, getPagination, paginatedResponse, createError } from '../utils/helpers.js'

/**
 * POST /api/agent/chat
 * Context-aware AI agent chat
 * Body: { processId, message }
 */
export const chat = async (req, res, next) => {
  try {
    const { processId, message } = req.body

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required.' })
    }

    // Load active process if processId provided (optional)
    let process = null
    if (processId) {
      process = await HiringProcess.findOne({ _id: processId, userId: req.user.id }).lean()
    }

    // Fallback context when no process selected
    const userState = process || {
      company: 'General',
      role: 'Software Engineer',
      currentStage: 'Applied',
      timeline: null,
    }

    // Load last 10 messages for conversation memory
    const chatHistoryQuery = processId
      ? { processId, userId: req.user.id }
      : { processId: null, userId: req.user.id }
    const chatHistory = await ChatMessage.find(chatHistoryQuery)
      .sort({ createdAt: 1 })
      .limit(10)
      .lean()

    // RAG: retrieve relevant questions based on user message
    let ragResults = []
    try {
      ragResults = await semanticSearch(message, {
        company: userState.company,
        role: userState.role,
        stage: userState.currentStage,
      }, 5)
    } catch (err) {
      console.warn('RAG search failed, continuing without context:', err.message)
    }

    // Save user message
    await ChatMessage.create({
      processId: processId || null,
      userId: req.user.id,
      role: 'user',
      content: message,
    })

    // Generate response
    const response = await chatWithContext(message, userState, chatHistory, ragResults)

    // Save assistant response
    const assistantMsg = await ChatMessage.create({
      processId: processId || null,
      userId: req.user.id,
      role: 'assistant',
      content: response,
      ragSources: ragResults.map((q) => q._id),
    })

    return sendSuccess(res, {
      message: response,
      messageId: assistantMsg._id,
      ragSourcesUsed: ragResults.length,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/agent/history/:processId
 * Get chat history for a process
 */
export const getChatHistory = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query)

    const process = await HiringProcess.findOne({
      _id: req.params.processId,
      userId: req.user.id,
    }).lean()
    if (!process) throw createError('Process not found', 404)

    const [messages, total] = await Promise.all([
      ChatMessage.find({ processId: req.params.processId, userId: req.user.id })
        .lean()
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      ChatMessage.countDocuments({ processId: req.params.processId, userId: req.user.id }),
    ])

    return sendSuccess(res, paginatedResponse(messages, total, page, limit))
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/agent/mock-interview
 * Generate a mock interview session
 * Body: { processId, weakTopics[] }
 */
export const getMockInterview = async (req, res, next) => {
  try {
    const { processId, weakTopics = [] } = req.body
    if (!processId) {
      return res.status(400).json({ success: false, message: 'processId is required.' })
    }

    const process = await HiringProcess.findOne({
      _id: processId,
      userId: req.user.id,
    }).lean()
    if (!process) throw createError('Process not found', 404)

    const mockInterview = await generateMockInterview(process, weakTopics)
    return sendSuccess(res, { mockInterview })
  } catch (error) {
    next(error)
  }
}
