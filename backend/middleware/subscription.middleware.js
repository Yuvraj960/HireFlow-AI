/**
 * Subscription Guard Middleware
 *
 * Ensures user has an active subscription before accessing AI-powered routes.
 * Status flow:  pending_payment → onboarding → active → (canceled)
 *
 * Only users with status 'active' (or 'onboarding' for onboarding endpoints)
 * can access protected AI routes.
 */
export const requireSubscription = (req, res, next) => {
  // ── DEV MODE: skip subscription check entirely ──────────────────────────────
  if (process.env.BYPASS_PAYMENT === 'true') return next()

  const { status } = req.user

  if (status === 'active') {
    return next()
  }

  if (status === 'pending_payment') {
    return res.status(402).json({
      success: false,
      code: 'PAYMENT_REQUIRED',
      message:
        'Payment required to access this feature. Please complete your subscription.',
    })
  }

  if (status === 'onboarding') {
    return res.status(403).json({
      success: false,
      code: 'ONBOARDING_INCOMPLETE',
      message:
        'Please complete your onboarding profile before using the app.',
    })
  }

  if (status === 'canceled') {
    return res.status(402).json({
      success: false,
      code: 'SUBSCRIPTION_CANCELED',
      message:
        'Your subscription has been canceled. Please renew to continue.',
    })
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied.',
  })
}

/**
 * Allows access only if onboarding is completed.
 * Used after requireSubscription in the chain.
 */
export const requireOnboardingComplete = (req, res, next) => {
  if (!req.user.onboardingCompleted) {
    return res.status(403).json({
      success: false,
      code: 'ONBOARDING_INCOMPLETE',
      message: 'Please complete your profile setup first.',
    })
  }
  next()
}
