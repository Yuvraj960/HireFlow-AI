import express from 'express'
import {
  razorpayWebhook,
  verifyPayment,
  getSubscriptionStatus,
  cancelUserSubscription,
} from '../controllers/payment.controller.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = express.Router()

/**
 * Razorpay Webhook — must receive RAW body (not parsed JSON).
 * Razorpay sends X-Razorpay-Signature which we verify against the raw body.
 * express.raw() is applied in server.js specifically for this route.
 */
router.post('/webhook', razorpayWebhook)

/**
 * Verify payment from frontend callback (instant activation path).
 * Called immediately after Razorpay checkout modal closes successfully.
 * No auth required — user isn't logged in yet at this point.
 */
router.post('/verify', verifyPayment)

// Protected routes (require JWT)
router.get('/subscription', authenticate, getSubscriptionStatus)
router.post('/cancel', authenticate, cancelUserSubscription)

export default router
