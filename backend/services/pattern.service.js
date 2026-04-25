/**
 * HireFlow AI — Pattern Mining Service
 *
 * Pure MongoDB aggregation — no AI calls required.
 * Mines patterns from the Experience and UserActivity collections.
 */
import Experience from '../models/Experience.js'
import UserActivity from '../models/UserActivity.js'

// ── 1. Mine Topic Patterns from Experiences ───────────────────────────────────
/**
 * Mine the most frequent interview topics for a given company/role from verified experiences.
 * Returns topics ranked by frequency with percentage of total experiences.
 *
 * @param {string} company
 * @param {string} [role]
 * @returns {Promise<Array>} - [{ topic, count, percentage }]
 */
export const minePatterns = async (company, role) => {
  const matchStage = { isVerified: true, isPublic: true }
  if (company) matchStage.company = new RegExp(company, 'i')
  if (role)    matchStage.role    = new RegExp(role, 'i')

  const total = await Experience.countDocuments(matchStage)
  if (total === 0) return []

  return Experience.aggregate([
    { $match: matchStage },
    { $unwind: '$topics' },
    {
      $group: {
        _id: '$topics',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 15 },
    {
      $project: {
        _id: 0,
        topic: '$_id',
        count: 1,
        percentage: {
          $round: [{ $multiply: [{ $divide: ['$count', total] }, 100] }, 1],
        },
      },
    },
  ])
}

// ── 2. Topic Frequency Map ────────────────────────────────────────────────────
/**
 * Compute a topic-to-count frequency map from an in-memory array of experiences.
 * Useful for quick in-memory analysis without a DB round-trip.
 *
 * @param {Array} experiences - Experience documents
 * @returns {Object} - { topicName: count }
 */
export const getTopicFrequency = (experiences) => {
  const freq = {}
  for (const exp of experiences) {
    if (Array.isArray(exp.topics)) {
      for (const topic of exp.topics) {
        freq[topic] = (freq[topic] || 0) + 1
      }
    }
  }
  return freq
}

// ── 3. Round-wise Difficulty Distribution ─────────────────────────────────────
/**
 * Get difficulty distribution broken down by interview round for a company.
 *
 * @param {string} company
 * @returns {Promise<Array>} - [{ _id: round, difficulties: [{ difficulty, count }] }]
 */
export const getRoundDifficultyDistribution = async (company) => {
  const matchStage = { isVerified: true, company: new RegExp(company, 'i') }

  return Experience.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { round: '$round', difficulty: '$difficulty' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    {
      $group: {
        _id: '$_id.round',
        difficulties: {
          $push: { difficulty: '$_id.difficulty', count: '$count' },
        },
      },
    },
  ])
}

// ── 4. User Performance Insights ──────────────────────────────────────────────
/**
 * Get topic-wise performance insights for a given user by aggregating their
 * solved questions from the UserActivity collection.
 *
 * Pipeline:
 *   1. Match by userId and action='solved'
 *   2. Join with questions collection to get topic
 *   3. Group by topic, count solved questions
 *   4. Sort by most solved (strongest topics first)
 *
 * Used by the dashboard performance endpoint to identify weak areas
 * that feed into generateMockInterview().
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Array>} - [{ _id: topic, solved: count }]
 */
export const getPerformanceInsights = async (userId) => {
  return UserActivity.aggregate([
    {
      $match: {
        userId,
        action: 'solved',
      },
    },
    {
      $lookup: {
        from: 'questions',
        localField: 'questionId',
        foreignField: '_id',
        as: 'question',
      },
    },
    { $unwind: '$question' },
    {
      $group: {
        _id: '$question.topic',
        solved: { $sum: 1 },
      },
    },
    { $sort: { solved: -1 } },
    {
      $project: {
        _id: 0,
        topic: '$_id',
        solved: 1,
      },
    },
  ])
}
