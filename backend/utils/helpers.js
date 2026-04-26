/**
 * Safely parse JSON from a Gemini model response.
 * Strips any accidental markdown fences (```json ... ```) the model may wrap around output.
 * Returns null if parsing fails — callers must handle the null case.
 *
 * @param {string} text - Raw text from model.generateContent().response.text()
 * @returns {object|null}
 */
export const safeParseJSON = (text) => {
  if (!text || typeof text !== 'string') return null
  // Strip ```json ... ``` or ``` ... ``` markdown fences
  const cleaned = text.replace(/```(?:json)?\n?([\s\S]*?)```/g, '$1').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    return null // caller handles null case
  }
}

/**
 * Send a standardized success JSON response
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

/**
 * Build pagination metadata from query params
 * @param {Object} query - Express req.query
 * @returns { page, limit, skip }
 */
export const getPagination = (query) => {
  const page = Math.max(parseInt(query.page) || 1, 1)
  const limit = Math.min(parseInt(query.limit) || 20, 100) // max 100 per page
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

/**
 * Build paginated response object
 */
export const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  },
})

/**
 * Create a custom error with status code
 */
export const createError = (message, statusCode = 400) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}
