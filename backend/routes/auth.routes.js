import express from 'express'
import {
  register,
  login,
  completeOnboarding,
  getMe,
  registerValidation,
  loginValidation,
  onboardingValidation,
} from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

// Step 1: Register + create Razorpay subscription → returns subscriptionId + keyId
router.post('/register', registerValidation, register)

// Step 2: Login (gated — only after payment webhook fires)
router.post('/login', loginValidation, login)

// Step 3: Complete onboarding profile (requires auth)
router.post('/onboarding', authenticate, onboardingValidation, completeOnboarding)

// Get current user
router.get('/me', authenticate, getMe)

export default router
