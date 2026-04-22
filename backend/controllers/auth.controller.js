import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { createSubscription } from '../services/razorpay.service.js'
import { sendSuccess, createError } from '../utils/helpers.js'

// ── Validation Rules ──────────────────────────────────────────────────────────
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
]

export const onboardingValidation = [
  body('userType')
    .isIn(['student', 'professional'])
    .withMessage('userType must be student or professional'),
  body('field').trim().notEmpty().withMessage('Field of study/work is required'),
  body('interviewCount')
    .isIn(['0', '1-3', '4-10', '10+'])
    .withMessage('Invalid interview count'),
  body('skillLevel')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid skill level'),
]

// ── Helper ────────────────────────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    })
  }
  return null
}

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * Step 1: Register user + create Razorpay subscription
 * POST /api/auth/register
 *
 * DEV MODE (BYPASS_PAYMENT=true in .env):
 *   Skips Razorpay entirely. User is immediately set to 'onboarding'
 *   so they can log in and test the app without payment credentials.
 *
 * PRODUCTION:
 *   Returns subscriptionId + razorpayKeyId for the frontend to open
 *   the Razorpay checkout modal.
 */
export const register = async (req, res, next) => {
  try {
    const validationError = handleValidationErrors(req, res)
    if (validationError) return

    const { name, email, password } = req.body
    const bypassPayment = process.env.BYPASS_PAYMENT === 'true'

    // Check duplicate email
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      })
    }

    // ── DEV MODE: skip payment, activate immediately ────────────────────────
    if (bypassPayment) {
      const user = await User.create({
        name,
        email,
        password,
        status: 'onboarding', // skip pending_payment
      })
      console.log(`⚠️  [DEV] BYPASS_PAYMENT=true — user ${user._id} activated without payment`)
      return sendSuccess(
        res,
        {
          userId: user._id,
          bypassPayment: true,
          message: 'Dev mode: payment skipped. You can now log in.',
        },
        'Account created (dev mode — payment bypassed).',
        201
      )
    }

    // ── PRODUCTION: create Razorpay subscription ────────────────────────────
    const user = await User.create({ name, email, password })

    const subscription = await createSubscription(user._id.toString())
    user.razorpaySubscriptionId = subscription.id
    await user.save()

    return sendSuccess(
      res,
      {
        userId: user._id,
        subscriptionId: subscription.id,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        amount: 1000,
        currency: 'INR',
        name: 'HireFlow AI Pro',
        description: 'Monthly subscription — ₹10/month',
        prefill: {
          name: user.name,
          email: user.email,
        },
      },
      'Account created. Complete payment to activate.',
      201
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Step 2 (post-payment): Login
 * Only allowed if status is 'onboarding' or 'active'
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const validationError = handleValidationErrors(req, res)
    if (validationError) return

    const { email, password } = req.body

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      })
    }

    // Payment gate — cannot login before payment
    if (user.status === 'pending_payment') {
      // In dev bypass mode, auto-promote to onboarding so login works
      if (process.env.BYPASS_PAYMENT === 'true') {
        user.status = 'onboarding'
        await user.save()
        console.log(`⚠️  [DEV] BYPASS_PAYMENT=true — auto-promoting user ${user._id} to onboarding`)
      } else {
        let subscriptionData = null
        if (user.razorpaySubscriptionId) {
          subscriptionData = {
            subscriptionId: user.razorpaySubscriptionId,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
          }
        }
        return res.status(402).json({
          success: false,
          code: 'PAYMENT_REQUIRED',
          message: 'Please complete payment to access your account.',
          ...subscriptionData,
        })
      }
    }

    if (user.status === 'canceled') {
      return res.status(402).json({
        success: false,
        code: 'SUBSCRIPTION_CANCELED',
        message: 'Your subscription has been canceled. Please renew to log in.',
      })
    }

    const token = generateToken(user._id)

    return sendSuccess(res, {
      token,
      user: user.toJSON(),
      requiresOnboarding: user.status === 'onboarding' && !user.onboardingCompleted,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Step 3: Complete onboarding profile
 * POST /api/auth/onboarding
 * Requires: authenticate middleware
 */
export const completeOnboarding = async (req, res, next) => {
  try {
    const validationError = handleValidationErrors(req, res)
    if (validationError) return

    const user = await User.findById(req.user.id)
    if (!user) throw createError('User not found', 404)

    if (user.status === 'pending_payment') {
      return res.status(402).json({
        success: false,
        message: 'Payment required before completing onboarding.',
      })
    }

    const {
      userType,
      field,
      college,
      company,
      yearsOfExperience,
      interviewCount,
      targetRoles,
      targetCompanies,
      skillLevel,
    } = req.body

    user.userType = userType
    user.field = field
    if (college) user.college = college
    if (company) user.company = company
    if (yearsOfExperience !== undefined) user.yearsOfExperience = yearsOfExperience
    if (interviewCount) user.interviewCount = interviewCount
    if (targetRoles) user.targetRoles = targetRoles
    if (targetCompanies) user.targetCompanies = targetCompanies
    if (skillLevel) user.skillLevel = skillLevel

    user.onboardingCompleted = true
    user.status = 'active'

    await user.save()

    const token = generateToken(user._id)

    return sendSuccess(
      res,
      { token, user: user.toJSON() },
      'Onboarding complete! Welcome to HireFlow AI.'
    )
  } catch (error) {
    next(error)
  }
}

/**
 * Get current authenticated user
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) throw createError('User not found', 404)
    return sendSuccess(res, { user })
  } catch (error) {
    next(error)
  }
}
