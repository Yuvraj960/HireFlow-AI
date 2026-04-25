import mongoose from 'mongoose'

const userActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    processId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HiringProcess',
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    action: {
      type: String,
      enum: ['viewed', 'solved', 'skipped', 'bookmarked'],
      required: true,
    },
    timeSpent: { type: Number, default: 0 }, // in seconds
  },
  { timestamps: true }
)

userActivitySchema.index({ userId: 1, createdAt: -1 })
userActivitySchema.index({ userId: 1, questionId: 1, action: 1 })

const UserActivity = mongoose.model('UserActivity', userActivitySchema)
export default UserActivity
