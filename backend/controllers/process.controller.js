import { body, validationResult } from 'express-validator'
import HiringProcess from '../models/HiringProcess.js'
import Question from '../models/Question.js'
import Experience from '../models/Experience.js'
import { generateRoadmap } from '../services/gemini.service.js'
import { sendSuccess, getPagination, paginatedResponse, createError } from '../utils/helpers.js'

const SIGNIFICANT_STAGE_CHANGE = ['Round1', 'Round2', 'HR', 'Offer', 'Rejected']

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    })
  }
  return null
}

export const createProcessValidation = [
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('role').trim().notEmpty().withMessage('Role is required'),
  body('currentStage')
    .isIn(['Applied', 'OA', 'Round1', 'Round2', 'HR', 'Offer', 'Rejected'])
    .withMessage('Invalid stage'),
]

/**
 * POST /api/process
 * Create a new hiring process with AI-generated roadmap
 */
export const createProcess = async (req, res, next) => {
  try {
    const validationError = handleValidationErrors(req, res)
    if (validationError) return

    const { company, role, currentStage, timeline, notes } = req.body
    const stage = currentStage || 'Applied'

    // Generate roadmap via Gemini — fall back to static roadmap if API unavailable
    let roadmap = null
    try {
      roadmap = await generateRoadmap(company, role, stage, timeline)
    } catch (err) {
      console.warn('[Roadmap] Gemini unavailable — using static fallback:', err.message)
    }

    // Static fallback if Gemini failed or returned null
    if (!roadmap) {
      const stageTopics = {
        Applied:  ['Arrays & Strings', 'Basic Data Structures', 'Company Research', 'Resume Polish'],
        OA:       ['DSA Patterns (Sliding Window, Two Pointers)', 'LeetCode Easy/Medium', 'Time Complexity Analysis', 'SQL Basics'],
        Round1:   ['Dynamic Programming', 'Graphs (BFS/DFS)', 'Binary Search', 'Recursion & Backtracking'],
        Round2:   ['System Design Basics', 'Database Design', 'API Design', 'Advanced DSA (Heaps, Tries)'],
        HR:       ['STAR Method Stories', 'Leadership Principles', 'Why This Company?', 'Salary Negotiation'],
      }
      const focusTopics = stageTopics[stage] || stageTopics['Applied']

      roadmap = {
        overview: `${company} typically runs a structured ${stage === 'OA' ? '4-5 round' : '3-4 round'} interview process for ${role} positions. Expect a mix of DSA, system design, and behavioral rounds.`,
        expectedRounds: ['OA', 'Round1', 'Round2', 'HR'],
        currentFocus: `You are currently at the ${stage} stage. Focus on ${focusTopics[0]} and ${focusTopics[1]}.`,
        topicPriority: focusTopics.map((t, i) => ({
          topic: t,
          priority: i < 2 ? 'high' : i < 3 ? 'medium' : 'low',
          reason: i === 0 ? 'Most commonly tested at this stage' : i === 1 ? 'Frequently appears in interviews at this level' : 'Good to have solid foundation',
        })),
        dailyPlan: [
          { day: 1, tasks: [`Study ${focusTopics[0]}`, 'Solve 2 LeetCode problems', 'Review notes'] },
          { day: 2, tasks: [`Practice ${focusTopics[1]}`, 'Mock interview (30 mins)', 'Company research'] },
          { day: 3, tasks: ['Timed practice session (90 mins)', `Review ${focusTopics[2] || focusTopics[0]}`, 'Rest & review'] },
        ],
        mustDoPatterns: ['Two Pointers', 'Sliding Window', 'Binary Search', 'DFS/BFS', 'Dynamic Programming'],
        timeAllocation: { DSA: '40%', SystemDesign: '25%', BehavioralPrep: '20%', MockInterviews: '15%' },
        tips: [
          `Research ${company}'s engineering blog and recent tech talks`,
          'Practice explaining your approach before coding — interviewers value communication',
          'Always ask clarifying questions before starting to code',
        ],
        _fallback: true,
      }
    }

    const process = await HiringProcess.create({
      userId: req.user.id,
      company,
      role,
      currentStage: stage,
      timeline: timeline ? new Date(timeline) : undefined,
      roadmap,
      notes,
      stageHistory: [{ stage }],
    })

    // Auto-seed company-specific questions & experiences in background
    autoSeedForCompany(company, req.user.id).catch(() => {})

    return sendSuccess(res, { process }, 'Hiring process created.', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * Background: seed questions and experiences for a specific company if not already seeded
 */
const autoSeedForCompany = async (company, userId) => {
  const existingQ = await Question.countDocuments({ company })
  if (existingQ === 0) {
    console.log(`[AutoSeed] No questions found for ${company} — company will appear in search.`)
  }
  const existingE = await Experience.countDocuments({ company, isPublic: true })
  if (existingE === 0) {
    console.log(`[AutoSeed] No experiences for ${company} — users can share via the Experiences page.`)
  }
}


/**
 * GET /api/process
 * Get all processes for the authenticated user (paginated)
 */
export const getAllProcesses = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query)

    const filter = { userId: req.user.id }
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true'
    }

    const [processes, total] = await Promise.all([
      HiringProcess.find(filter)
        .lean()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      HiringProcess.countDocuments(filter),
    ])

    return sendSuccess(res, paginatedResponse(processes, total, page, limit))
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/process/:id
 * Get a single hiring process
 */
export const getProcess = async (req, res, next) => {
  try {
    const process = await HiringProcess.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean()

    if (!process) throw createError('Process not found', 404)
    return sendSuccess(res, { process })
  } catch (error) {
    next(error)
  }
}

/**
 * PATCH /api/process/:id/stage
 * Update stage and optionally re-generate roadmap
 */
export const updateStage = async (req, res, next) => {
  try {
    const { stage, newStage, note } = req.body
    const targetStage = stage || newStage
    if (!targetStage) return res.status(400).json({ success: false, message: 'Stage is required.' })

    const process = await HiringProcess.findOne({
      _id: req.params.id,
      userId: req.user.id,
    })
    if (!process) throw createError('Process not found', 404)

    // Log history
    process.stageHistory.push({ stage: process.currentStage, note })
    process.currentStage = targetStage

    // Re-generate roadmap if stage is a significant milestone
    if (SIGNIFICANT_STAGE_CHANGE.includes(targetStage)) {
      try {
        process.roadmap = await generateRoadmap(
          process.company,
          process.role,
          targetStage,
          process.timeline
        )
      } catch (err) {
        console.warn('Roadmap recalibration failed:', err.message)
      }
    }

    await process.save()
    return sendSuccess(res, { process }, 'Stage updated and recommendations refreshed.')
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/process/:id
 */
export const deleteProcess = async (req, res, next) => {
  try {
    const process = await HiringProcess.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    })
    if (!process) throw createError('Process not found', 404)
    return sendSuccess(res, null, 'Process deleted.')
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/process/:id/questions
 * Log a question asked in a specific stage of this process
 * Body: { text, stage, difficulty, topic, notes }
 */
export const logQuestion = async (req, res, next) => {
  try {
    const { text, stage, difficulty, topic, notes } = req.body
    if (!text) return res.status(400).json({ success: false, message: 'Question text is required.' })

    const process = await HiringProcess.findOne({ _id: req.params.id, userId: req.user.id })
    if (!process) throw createError('Process not found', 404)

    process.questionsLogged.push({
      text,
      stage: stage || process.currentStage,
      difficulty: difficulty || 'Medium',
      topic: topic || 'General',
      notes,
      loggedAt: new Date(),
    })
    await process.save()

    return sendSuccess(res, { questionsLogged: process.questionsLogged }, 'Question logged.')
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/process/:id/questions
 * Get all questions logged for this process
 */
export const getProcessQuestions = async (req, res, next) => {
  try {
    const process = await HiringProcess.findOne(
      { _id: req.params.id, userId: req.user.id },
      'questionsLogged company role currentStage'
    ).lean()
    if (!process) throw createError('Process not found', 404)
    return sendSuccess(res, { questionsLogged: process.questionsLogged || [] })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/process/:id/roadmap
 * Regenerate the AI roadmap for an existing process
 */
export const regenerateRoadmap = async (req, res, next) => {
  try {
    const process = await HiringProcess.findOne({ _id: req.params.id, userId: req.user.id })
    if (!process) throw createError('Process not found', 404)

    let roadmap = null
    try {
      roadmap = await generateRoadmap(process.company, process.role, process.currentStage, process.timeline)
    } catch (err) {
      console.warn('[Roadmap] Gemini failed, using fallback:', err.message)
    }

    if (!roadmap) {
      roadmap = {
        overview: `${process.company} interview process for ${process.role}. Study systematically and practice daily.`,
        expectedRounds: ['OA', 'Round1', 'Round2', 'HR'],
        currentFocus: `At ${process.currentStage} stage — prioritize hands-on problem solving and mock interviews.`,
        topicPriority: [
          { topic: 'DSA Fundamentals', priority: 'high', reason: 'Core of all technical rounds' },
          { topic: 'System Design', priority: 'medium', reason: 'Required for senior-level rounds' },
          { topic: 'Behavioral (STAR)', priority: 'medium', reason: 'Tested in every company HR round' },
        ],
        dailyPlan: [
          { day: 1, tasks: ['Solve 3 LeetCode problems', 'Review one system design concept'] },
          { day: 2, tasks: ['Mock interview session', 'Study company engineering blog'] },
          { day: 3, tasks: ['Behavioral story preparation', 'Topic deep-dive'] },
        ],
        mustDoPatterns: ['Two Pointers', 'Sliding Window', 'Binary Search', 'BFS/DFS', 'Dynamic Programming'],
        timeAllocation: { DSA: '40%', SystemDesign: '25%', BehavioralPrep: '20%', MockInterviews: '15%' },
        tips: ['Communicate your thought process aloud', 'Ask clarifying questions', 'Practice under timed conditions'],
        _fallback: true,
      }
    }

    process.roadmap = roadmap
    await process.save()
    return sendSuccess(res, { process }, 'Roadmap regenerated.')
  } catch (error) {
    next(error)
  }
}
