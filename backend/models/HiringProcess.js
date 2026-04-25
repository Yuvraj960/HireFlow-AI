import mongoose from 'mongoose'

const stageHistorySchema = new mongoose.Schema(
  {
    stage: { type: String },
    updatedAt: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false }
)

const questionLogSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    stage: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    topic: { type: String, default: 'General' },
    notes: { type: String },
    loggedAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const hiringProcessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    currentStage: {
      type: String,
      enum: ['Applied', 'OA', 'Round1', 'Round2', 'HR', 'Offer', 'Rejected'],
      default: 'Applied',
    },
    timeline: { type: Date },
    roadmap: { type: mongoose.Schema.Types.Mixed },
    stageHistory: [stageHistorySchema],
    questionsLogged: [questionLogSchema],
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

const HiringProcess = mongoose.model('HiringProcess', hiringProcessSchema)
export default HiringProcess

