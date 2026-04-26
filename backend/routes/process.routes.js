import express from 'express'
import {
  createProcess,
  getAllProcesses,
  getProcess,
  updateStage,
  deleteProcess,
  logQuestion,
  getProcessQuestions,
  regenerateRoadmap,
  createProcessValidation,
} from '../controllers/process.controller.js'

const router = express.Router()

router.post('/', createProcessValidation, createProcess)
router.get('/', getAllProcesses)
router.get('/:id', getProcess)
router.patch('/:id/stage', updateStage)
router.delete('/:id', deleteProcess)
router.post('/:id/questions', logQuestion)
router.get('/:id/questions', getProcessQuestions)
router.post('/:id/roadmap', regenerateRoadmap)

export default router
