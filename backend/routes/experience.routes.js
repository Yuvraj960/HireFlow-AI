import express from 'express'
import {
  submitExperience,
  getExperiences,
  getInsights,
  getFeed,
} from '../controllers/experience.controller.js'

const router = express.Router()

// NOTE: /insights and /feed must come before /:id if added later
router.get('/insights', getInsights)
router.get('/feed', getFeed)
router.post('/', submitExperience)
router.get('/', getExperiences)

export default router
