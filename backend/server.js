import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'

// Route imports
import authRoutes from './routes/auth.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import processRoutes from './routes/process.routes.js'
import questionRoutes from './routes/question.routes.js'
import experienceRoutes from './routes/experience.routes.js'
import agentRoutes from './routes/agent.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import { seedQuestions, seedExperiences, seedByCompany } from './controllers/seed.controller.js'

// Middleware imports
import { authenticate } from './middleware/auth.middleware.js'
import { requireSubscription, requireOnboardingComplete } from './middleware/subscription.middleware.js'
import { errorHandler } from './middleware/error.middleware.js'

dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
    credentials: true,
  })
)

// ── IMPORTANT: Razorpay webhook needs raw body ───────────────────────────────
// Signature is verified with HMAC-SHA256 against the raw body string.
// Must be mounted BEFORE express.json() so body stays unparsed for this route.
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }))

// ── Body Parser ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true }))

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    service: 'HireFlow AI Backend',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  })
})

// ── Public Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/payment', paymentRoutes)

// ── Protected Routes (require JWT + active subscription + onboarding done) ────
app.use(
  '/api/process',
  authenticate,
  requireSubscription,
  requireOnboardingComplete,
  processRoutes
)

app.use(
  '/api/questions',
  authenticate,
  requireSubscription,
  requireOnboardingComplete,
  questionRoutes
)

app.use(
  '/api/experiences',
  authenticate,
  requireSubscription,
  requireOnboardingComplete,
  experienceRoutes
)

app.use(
  '/api/agent',
  authenticate,
  requireSubscription,
  requireOnboardingComplete,
  agentRoutes
)

app.use(
  '/api/dashboard',
  authenticate,
  requireSubscription,
  requireOnboardingComplete,
  dashboardRoutes
)

// ── Seed Routes (auth-protected) ────────────────────────────────────────────────
app.post('/api/seed/questions',    authenticate, seedQuestions)
app.post('/api/seed/experiences',  authenticate, seedExperiences)
app.post('/api/seed/company',      authenticate, seedByCompany)

// ── User Profile Route ────────────────────────────────────────────────────────
app.get('/api/user/profile', authenticate, async (req, res) => {
  const User = (await import('./models/User.js')).default
  const user = await User.findById(req.user.id).select('-password -__v').lean()
  res.json({ success: true, data: { user } })
})

app.patch('/api/user/profile', authenticate, async (req, res) => {
  const User = (await import('./models/User.js')).default
  const allowed = ['name', 'field', 'college', 'company', 'targetRoles', 'targetCompanies', 'skillLevel']
  const updates = {}
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password -__v').lean()
  res.json({ success: true, data: { user } })
})

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  })
})

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`
  🚀 HireFlow AI Backend Running
  ────────────────────────────────
  🌐 URL:         http://localhost:${PORT}
  💚 Health:      http://localhost:${PORT}/health
  🌍 Environment: ${process.env.NODE_ENV}
  ────────────────────────────────
  `)
})

export default app
