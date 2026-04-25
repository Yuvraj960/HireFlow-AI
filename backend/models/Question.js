import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String, required: true },
    company:     [{ type: String, trim: true }],
    role:        [{ type: String, trim: true }],
    stage: [
      {
        type: String,
        enum: ['Applied', 'OA', 'Round1', 'Round2', 'HR'],
      },
    ],
    topic:      { type: String, trim: true },  // e.g., "Graph", "DP"
    pattern:    { type: String, trim: true },  // e.g., "Sliding Window"
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    externalLink: { type: String },
    isInternal:   { type: Boolean, default: false },
    frequency:    { type: Number, default: 1 },
    tags:         [{ type: String }],

    // Vector embedding for semantic search (768-dim from text-embedding-004)
    embedding: { type: [Number], select: false },
  },
  { timestamps: true }
)

// ── Indexes ───────────────────────────────────────────────────────────────────
// IMPORTANT: MongoDB does NOT allow a single compound index to cover multiple
// array fields simultaneously ("parallel arrays" error). Each array field must
// have its own separate index.
questionSchema.index({ company: 1 })          // filter by company[]
questionSchema.index({ stage: 1 })            // filter by stage[]
questionSchema.index({ topic: 1 })            // filter by topic (string)
questionSchema.index({ difficulty: 1 })       // filter by difficulty
questionSchema.index({ frequency: -1 })       // sort by popularity
questionSchema.index({ pattern: 1 })          // filter by pattern

// Full-text index for local dev fallback (when Atlas vector search is unavailable)
questionSchema.index({ title: 'text', description: 'text', topic: 'text', pattern: 'text' })

const Question = mongoose.model('Question', questionSchema)
export default Question
