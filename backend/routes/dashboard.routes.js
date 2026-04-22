import express from 'express'
import {
  getOverview,
  getPerformance,
  getPrediction,
  getTimePlan,
} from '../controllers/dashboard.controller.js'

const router = express.Router()

router.get('/overview', getOverview)
router.get('/performance', getPerformance)
router.get('/predict', getPrediction)
router.get('/time-plan', getTimePlan)

export default router
