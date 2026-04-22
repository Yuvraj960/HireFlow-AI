import HiringProcess from '../models/HiringProcess.js'
import UserActivity from '../models/UserActivity.js'
import Question from '../models/Question.js'
import User from '../models/User.js'
import { predictPatterns } from '../services/gemini.service.js'
import { getPerformanceInsights } from '../services/pattern.service.js'
import { sendSuccess, createError } from '../utils/helpers.js'

/**
 * GET /api/dashboard/overview
 * All hiring processes + timeline + outcome summary for the user
 */
export const getOverview = async (req, res, next) => {
  try {
    const processes = await HiringProcess.find({ userId: req.user.id })
      .lean()
      .sort({ updatedAt: -1 })

    const summary = {
      total: processes.length,
      active: processes.filter((p) => p.isActive).length,
      byStage: {},
      outcomes: {
        Offer: 0,
        Rejected: 0,
        InProgress: 0,
      },
    }

    for (const p of processes) {
      summary.byStage[p.currentStage] = (summary.byStage[p.currentStage] || 0) + 1
      if (p.currentStage === 'Offer') summary.outcomes.Offer++
      else if (p.currentStage === 'Rejected') summary.outcomes.Rejected++
      else summary.outcomes.InProgress++
    }

    return sendSuccess(res, { processes, summary })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/dashboard/performance
 * Topic-wise performance insights based on user activity
 */
export const getPerformance = async (req, res, next) => {
  try {
    const userId = req.user.id

    // Get all solved + skipped activities
    const activities = await UserActivity.find({
      userId,
      action: { $in: ['solved', 'skipped', 'bookmarked'] },
    })
      .populate('questionId', 'topic difficulty pattern')
      .lean()

    const topicStats = {}

    for (const activity of activities) {
      if (!activity.questionId?.topic) continue
      const topic = activity.questionId.topic
      if (!topicStats[topic]) {
        topicStats[topic] = { solved: 0, skipped: 0, bookmarked: 0, total: 0 }
      }
      topicStats[topic][activity.action]++
      topicStats[topic].total++
    }

    // Compute strength score per topic (solved / total * 100)
    const performance = Object.entries(topicStats).map(([topic, stats]) => ({
      topic,
      ...stats,
      strengthScore: stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0,
    }))

    performance.sort((a, b) => b.strengthScore - a.strengthScore)

    const strengths = performance.filter((p) => p.strengthScore >= 70)
    const weaknesses = performance.filter((p) => p.strengthScore < 50 && p.total >= 2)

    // Pattern service: solved topic counts via UserActivity aggregation
    let topicInsights = []
    try {
      topicInsights = await getPerformanceInsights(userId)
    } catch (err) {
      console.warn('getPerformanceInsights failed:', err.message)
    }

    return sendSuccess(res, {
      performance,
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 5),
      totalQuestionsAttempted: activities.length,
      topicInsights,   // [{ topic, solved }] — ranked by solved count
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/dashboard/predict?processId=...
 * Predict interview patterns for user's active process
 */
export const getPrediction = async (req, res, next) => {
  try {
    const { processId } = req.query
    if (!processId) {
      return res.status(400).json({
        success: false,
        message: 'processId query parameter is required.',
      })
    }

    const process = await HiringProcess.findOne({
      _id: processId,
      userId: req.user.id,
    }).lean()
    if (!process) throw createError('Process not found', 404)

    const prediction = await predictPatterns(
      process.company,
      process.role,
      process.currentStage
    )

    return sendSuccess(res, { prediction, process })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/dashboard/time-plan?processId=...&days=...
 * Generate a time-optimized preparation plan
 */
export const getTimePlan = async (req, res, next) => {
  try {
    const { processId, days } = req.query
    if (!processId) {
      return res.status(400).json({ success: false, message: 'processId is required.' })
    }

    const process = await HiringProcess.findOne({
      _id: processId,
      userId: req.user.id,
    }).lean()
    if (!process) throw createError('Process not found', 404)

    const availableDays = parseInt(days) || 7

    // Get top questions for this company/role/stage
    const questions = await Question.find({
      company: { $in: [new RegExp(process.company, 'i')] },
      stage: { $in: [process.currentStage] },
    })
      .sort({ frequency: -1 })
      .limit(availableDays * 5)
      .lean()

    // Simple ROI-based distribution: ~5 questions per day
    const dailyPlan = []
    for (let day = 1; day <= availableDays; day++) {
      const dayQuestions = questions.slice((day - 1) * 5, day * 5)
      dailyPlan.push({
        day,
        focus: dayQuestions[0]?.topic || 'Mixed Topics',
        questions: dayQuestions.map((q) => ({
          id: q._id,
          title: q.title,
          difficulty: q.difficulty,
          topic: q.topic,
          externalLink: q.externalLink,
        })),
        estimatedTime: '3-4 hours',
      })
    }

    return sendSuccess(res, {
      company: process.company,
      role: process.role,
      availableDays,
      dailyPlan,
    })
  } catch (error) {
    next(error)
  }
}
