import express from 'express'
import {
  getQuestions,
  searchQuestions,
  getQuestion,
  addQuestion,
  trackActivity,
} from '../controllers/question.controller.js'

const router = express.Router()

// NOTE: search route MUST come before /:id to avoid route conflict
router.get('/search', searchQuestions)
router.get('/', getQuestions)
router.get('/:id', getQuestion)
router.post('/', addQuestion)
router.post('/:id/activity', trackActivity)

export default router
