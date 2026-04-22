import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never returned in queries by default
    },

    // ── Subscription & Payment ───────────────────────────
    status: {
      type: String,
      enum: ['pending_payment', 'onboarding', 'active', 'canceled'],
      default: 'pending_payment',
    },
    razorpaySubscriptionId: { type: String },

    // ── Onboarding Data (Step 3) ─────────────────────────
    onboardingCompleted: { type: Boolean, default: false },
    userType: { type: String, enum: ['student', 'professional'] },
    field: { type: String }, // e.g., "Computer Science", "Data Science"
    college: { type: String },
    company: { type: String }, // if professional
    yearsOfExperience: { type: Number, default: 0 },
    interviewCount: {
      type: String,
      enum: ['0', '1-3', '4-10', '10+'],
      default: '0',
    },
    targetRoles: [{ type: String }], // e.g., ["SDE-1", "Data Analyst"]
    targetCompanies: [{ type: String }],
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
  },
  { timestamps: true }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Never send password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

const User = mongoose.model('User', userSchema)
export default User
