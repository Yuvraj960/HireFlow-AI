export const STAGES = ['Applied', 'OA', 'Round1', 'Round2', 'HR', 'Offer', 'Rejected']

export const STAGE_ICONS = {
  Applied:  'send',
  OA:       'bolt',
  Round1:   'looks_one',
  Round2:   'looks_two',
  HR:       'badge',
  Offer:    'celebration',
  Rejected: 'close',
}

export const STAGE_LABELS = {
  Applied:  'Applied',
  OA:       'OA',
  Round1:   'Round 1',
  Round2:   'Round 2',
  HR:       'HR',
  Offer:    'Offer ✓',
  Rejected: 'Rejected',
}

export const stageIndex = (stage) => STAGES.indexOf(stage)

export const isStageComplete = (stage, currentStage) =>
  stageIndex(stage) < stageIndex(currentStage)

export const isStageActive = (stage, currentStage) => stage === currentStage

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return formatDate(dateStr)
}

export const difficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy':   return 'bg-primary-container text-on-primary-container'
    case 'medium': return 'bg-secondary-container/80 text-on-secondary-container'
    case 'hard':   return 'bg-error-container text-on-error-container'
    default:       return 'bg-surface-container-highest text-on-surface-variant'
  }
}

/** Extract nested data from a backend sendSuccess response */
export const unwrap = (res) => res?.data?.data ?? res?.data ?? res
