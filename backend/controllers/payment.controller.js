import User from '../models/User.js'
import {
  verifyWebhookSignature,
  verifyPaymentSignature,
  cancelSubscription,
  getSubscription,
  createSubscription,
} from '../services/razorpay.service.js'
import { sendSuccess, createError } from '../utils/helpers.js'

/**
 * Razorpay Webhook Handler
 * POST /api/payment/webhook
 *
 * Razorpay fires server-to-server events for subscription lifecycle.
 * We verify the X-Razorpay-Signature header against the raw body.
 * MUST use express.raw() — NOT express.json() on this route.
 *
 * Key events:
 *   subscription.activated  → user paid → move to 'onboarding'
 *   subscription.cancelled  → subscription ended → 'canceled'
 *   subscription.completed  → all billing cycles done → 'canceled'
 *   payment.failed          → payment failed → log/notify
 */
export const razorpayWebhook = async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature']

  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing webhook signature.' })
  }

  // Verify signature using raw body
  const rawBody = req.body // express.raw() gives Buffer
  const isValid = verifyWebhookSignature(rawBody, signature)

  if (!isValid) {
    console.error('❌ Razorpay webhook signature verification failed.')
    return res.status(400).json({ success: false, message: 'Invalid webhook signature.' })
  }

  let event
  try {
    event = JSON.parse(rawBody.toString())
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid JSON body.' })
  }

  const eventType = event.event
  console.log(`📡 Razorpay event received: ${eventType}`)

  try {
    switch (eventType) {
      case 'subscription.activated': {
        // User completed first payment — unlock login (move to onboarding phase)
        const subscriptionId = event.payload?.subscription?.entity?.id
        const notes = event.payload?.subscription?.entity?.notes

        if (!subscriptionId) break

        // Find user by subscriptionId stored during registration
        const user = await User.findOne({ razorpaySubscriptionId: subscriptionId })
        if (!user) {
          // Fallback: try notes.userId if present
          const userId = notes?.userId
          if (userId) {
            await User.findByIdAndUpdate(userId, {
              status: 'onboarding',
              razorpaySubscriptionId: subscriptionId,
            })
            console.log(`✅ User ${userId} activated via webhook → status: onboarding`)
          }
          break
        }

        user.status = 'onboarding'
        await user.save()
        console.log(`✅ User ${user._id} activated → status: onboarding`)
        break
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        const subscriptionId = event.payload?.subscription?.entity?.id
        if (!subscriptionId) break

        await User.findOneAndUpdate(
          { razorpaySubscriptionId: subscriptionId },
          { status: 'canceled' }
        )
        console.log(`❌ Subscription ${subscriptionId} ended → status: canceled`)
        break
      }

      case 'payment.failed': {
        const paymentEntity = event.payload?.payment?.entity
        console.warn(`⚠️  Payment failed: ${paymentEntity?.id} for ${paymentEntity?.email}`)
        // In a real app: send notification email to user
        break
      }

      default:
        console.log(`Unhandled Razorpay event: ${eventType}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error(`❌ Webhook processing error: ${error.message}`)
    return res.status(500).json({ error: 'Webhook handler failed.' })
  }
}

/**
 * Verify Payment from Frontend Callback (immediate activation path)
 * POST /api/payment/verify
 *
 * After Razorpay checkout completes, frontend receives:
 *   { razorpay_payment_id, razorpay_subscription_id, razorpay_signature }
 *
 * This endpoint verifies the signature and activates the account instantly,
 * without waiting for the webhook. Both paths are safe to run.
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification fields.',
      })
    }

    const isValid = verifyPaymentSignature(
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature
    )

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. Invalid payment.',
      })
    }

    // Activate the user — find by their subscriptionId stored at registration
    const user = await User.findOneAndUpdate(
      { razorpaySubscriptionId: razorpay_subscription_id },
      { status: 'onboarding' },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found for this subscription.',
      })
    }

    console.log(`✅ Payment verified for user ${user._id} → status: onboarding`)

    return sendSuccess(res, {
      verified: true,
      userId: user._id,
      status: user.status,
      message: 'Payment verified! You can now log in.',
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get current subscription status for authenticated user
 * GET /api/payment/subscription
 */
export const getSubscriptionStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      '+razorpaySubscriptionId +status'
    )
    if (!user) throw createError('User not found', 404)

    let subscriptionDetails = null
    if (user.razorpaySubscriptionId) {
      try {
        const sub = await getSubscription(user.razorpaySubscriptionId)
        subscriptionDetails = {
          id: sub.id,
          status: sub.status,               // active, created, authenticated, etc.
          currentStart: sub.current_start ? new Date(sub.current_start * 1000) : null,
          currentEnd: sub.current_end ? new Date(sub.current_end * 1000) : null,
          paidCount: sub.paid_count,
          remainingCount: sub.remaining_count,
        }
      } catch {
        // Razorpay lookup failed — use local status
      }
    }

    return sendSuccess(res, {
      status: user.status,
      subscription: subscriptionDetails,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Cancel subscription
 * POST /api/payment/cancel
 */
export const cancelUserSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+razorpaySubscriptionId')
    if (!user) throw createError('User not found', 404)
    if (!user.razorpaySubscriptionId) {
      throw createError('No active subscription found.', 404)
    }

    await cancelSubscription(user.razorpaySubscriptionId)
    await User.findByIdAndUpdate(req.user.id, { status: 'canceled' })

    return sendSuccess(res, null, 'Subscription canceled successfully.')
  } catch (error) {
    next(error)
  }
}
