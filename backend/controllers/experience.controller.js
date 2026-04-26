import Experience from '../models/Experience.js'
import { extractExperience, generateInsights } from '../services/gemini.service.js'
import { minePatterns } from '../services/pattern.service.js'
import { sendSuccess, getPagination, paginatedResponse, createError } from '../utils/helpers.js'

/**
 * POST /api/experiences
 * Submit a raw interview experience text and extract structured data
 */
export const submitExperience = async (req, res, next) => {
  try {
    const { rawText, isPublic } = req.body

    if (!rawText || rawText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Experience text must be at least 20 characters.',
      })
    }

    // Save raw text first (fail-safe)
    const experience = await Experience.create({
      userId: req.user.id,
      rawText,
      isPublic: isPublic !== false,
    })

    // Run Gemini extraction asynchronously
    try {
      const extracted = await extractExperience(rawText)
      const confidence = extracted.confidence || 0

      experience.company = extracted.company
      experience.role = extracted.role
      experience.round = extracted.round
      experience.topics = extracted.topics || []
      experience.difficulty = extracted.difficulty
      experience.outcome = extracted.outcome
      experience.isVerified = confidence >= 0.7

      await experience.save()
    } catch (err) {
      console.warn('Experience extraction failed:', err.message)
      // Still return saved raw experience
    }

    return sendSuccess(res, { experience }, 'Experience submitted and analyzed.', 201)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/experiences
 * Get experiences with filters: company, role, round (paginated)
 */
export const getExperiences = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const { company, role, round, myOnly } = req.query

    const filter = { isPublic: true }
    if (myOnly === 'true') {
      filter.userId = req.user.id
      delete filter.isPublic
    }
    if (company) filter.company = new RegExp(company, 'i')
    if (role) filter.role = new RegExp(role, 'i')
    if (round) filter.round = round

    const [experiences, total] = await Promise.all([
      Experience.find(filter)
        .lean()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name'),
      Experience.countDocuments(filter),
    ])

    return sendSuccess(res, paginatedResponse(experiences, total, page, limit))
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/experiences/insights?company=&role=
 * Get AI-generated pattern insights from aggregated experiences
 */
export const getInsights = async (req, res, next) => {
  try {
    const { company, role } = req.query

    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'company query parameter is required.',
      })
    }

    // Get raw experiences for Gemini analysis
    const filter = { isVerified: true }
    if (company) filter.company = new RegExp(company, 'i')
    if (role) filter.role = new RegExp(role, 'i')

    const experiences = await Experience.find(filter).lean().limit(50)

    // Statistical patterns (always fast)
    const topicPatterns = await minePatterns(company, role)

    // AI narrative insights
    let aiInsights = null
    if (experiences.length >= 3) {
      try {
        aiInsights = await generateInsights(experiences)
      } catch (err) {
        console.warn('AI insights generation failed:', err.message)
      }
    }

    return sendSuccess(res, {
      company,
      role: role || 'All roles',
      totalExperiences: experiences.length,
      topicPatterns,
      aiInsights,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/experiences/feed
 * Get a cleaned, ranked feed of public experiences
 */
export const getFeed = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query)
    const { company, role, round, difficulty } = req.query

    const filter = { isPublic: true, isVerified: true }
    if (company) filter.company = new RegExp(company, 'i')
    if (role) filter.role = new RegExp(role, 'i')
    if (round) filter.round = round
    if (difficulty) filter.difficulty = difficulty

    const [feed, total] = await Promise.all([
      Experience.find(filter)
        .lean()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name'),
      Experience.countDocuments(filter),
    ])

    return sendSuccess(res, paginatedResponse(feed, total, page, limit))
  } catch (error) {
    next(error)
  }
}
