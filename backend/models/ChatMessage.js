import mongoose from 'mongoose'

const chatMessageSchema = new mongoose.Schema(
  {
    processId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HiringProcess',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: { type: String, required: true },
    ragSources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], // which questions were used in RAG
  },
  { timestamps: true }
)

chatMessageSchema.index({ processId: 1, createdAt: 1 })

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema)
export default ChatMessage
