import Razorpay from 'razorpay'
import crypto from 'crypto'

/**
 * Lazy Razorpay instance — only initialized when a function is first called.
 * This prevents startup crash when RAZORPAY keys are not yet configured.
 */
let _razorpay = null

const getRazorpay = () => {
  if (!_razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        'Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env'
      )
    }
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  }
  return _razorpay
}

/**
 * Create a Razorpay Subscription for a user.
 * Requires a Plan to already exist in Razorpay Dashboard.
 */
export const createSubscription = async (userId) => {
  return getRazorpay().subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID,
    customer_notify: 1,
    quantity: 1,
    total_count: 120, // 120 months = effectively unlimited
    notes: { userId },
  })
}

/**
 * Fetch a Razorpay Subscription by ID
 */
export const getSubscription = async (subscriptionId) => {
  return getRazorpay().subscriptions.fetch(subscriptionId)
}

/**
 * Cancel a Razorpay Subscription
 * cancel_at_cycle_end = 1 → cancel at end of billing period (graceful)
 */
export const cancelSubscription = async (subscriptionId, immediately = false) => {
  return getRazorpay().subscriptions.cancel(subscriptionId, immediately ? 0 : 1)
}

/**
 * Verify Razorpay payment signature from frontend callback.
 * Signature = HMAC-SHA256(payment_id + "|" + subscription_id, key_secret)
 */
export const verifyPaymentSignature = (paymentId, subscriptionId, signature) => {
  const body = `${paymentId}|${subscriptionId}`
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}

/**
 * Verify Razorpay webhook signature.
 * Signature = HMAC-SHA256(raw_body_string, webhook_secret)
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')
  return expectedSignature === signature
}

export default getRazorpay
