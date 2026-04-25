import express from 'express'
import { chat, getChatHistory, getMockInterview } from '../controllers/agent.controller.js'

const router = express.Router()

router.post('/chat', chat)
router.get('/history/:processId', getChatHistory)
router.post('/mock-interview', getMockInterview)

export default router
