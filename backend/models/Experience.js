import mongoose from 'mongoose'

const experienceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // ── Core structured fields ────────────────────────────────────────────
    company:    { type: String, trim: true, index: true },
    role:       { type: String, trim: true },
    package:    { type: String },              // e.g. "18 LPA", "42 LPA"
    yoe:        { type: Number },              // years of experience at time
    location:   { type: String },              // e.g. "Bangalore", "Hyderabad"
    date:       { type: String },              // e.g. "March 2024"

    // ── Interview process meta ─────────────────────────────────────────────
    totalRounds: { type: Number },
    process:    { type: String },              // Brief process description
    duration:   { type: String },              // e.g. "3 weeks", "45 days"
    mode:       { type: String, enum: ['Online', 'Onsite', 'Hybrid', 'Phone'] },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    outcome:    { type: String, enum: ['Selected', 'Rejected', 'Pending', 'Unknown'], index: true },

    // ── Rich round-by-round breakdown ─────────────────────────────────────
    rounds: [
      {
        name:       { type: String },         // "Round 1 — DSA", "System Design", "HR"
        type:       { type: String },         // "OA", "Technical", "System Design", "HR", "Managerial"
        duration:   { type: String },         // "45 minutes"
        platform:   { type: String },         // "HackerRank", "CoderPad", "Zoom"
        questions:  [{ type: String }],       // actual questions asked
        experience: { type: String },         // narrative for this round
        tips:       [{ type: String }],
      },
    ],

    // ── Overall narrative + advice ─────────────────────────────────────────
    rawText:    { type: String, required: true }, // Full experience narrative
    tips:       [{ type: String }],              // Tips for future candidates
    topics:     [{ type: String }],              // e.g. ["Graphs", "System Design"]
    verdict:    { type: String },                // e.g. "Would recommend applying"

    // ── Ratings (0-5) ────────────────────────────────────────────────────
    rating:     { type: Number, min: 1, max: 5 },

    // ── Metadata ─────────────────────────────────────────────────────────
    isVerified: { type: Boolean, default: true },
    isPublic:   { type: Boolean, default: true },
    timeAgo:    { type: String },
    source:     { type: String, default: 'community' },
  },
  { timestamps: true }
)

// Single-field indexes only — avoids MongoDB parallel-arrays error
experienceSchema.index({ topics: 1 })
experienceSchema.index({ outcome: 1 })
experienceSchema.index({ isPublic: 1, createdAt: -1 })
experienceSchema.index({ rating: -1 })

const Experience = mongoose.model('Experience', experienceSchema)
export default Experience
