import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import { useProcessStore } from '../../store/processStore'
import { STAGES, STAGE_LABELS } from '../../utils/helpers'

export default function CreateProcessModal({ isOpen, onClose, onCreated }) {
  const { createProcess } = useProcessStore()
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { company: '', role: '', currentStage: 'Applied' }
  })

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      const process = await createProcess(data)
      toast.success(`Process for ${data.company} created!`)
      reset()
      onClose()
      if (onCreated) onCreated(process)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create process.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start New Hiring Process" size="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Company */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">Company *</label>
          <input
            {...register('company', { required: 'Company is required' })}
            placeholder="e.g. Google, Amazon, Flipkart"
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
          />
          {errors.company && <p className="text-error text-xs mt-1">{errors.company.message}</p>}
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">Role *</label>
          <input
            {...register('role', { required: 'Role is required' })}
            placeholder="e.g. SDE-1, Backend Engineer, Data Analyst"
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
          />
          {errors.role && <p className="text-error text-xs mt-1">{errors.role.message}</p>}
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">Current Stage</label>
          <select
            {...register('currentStage')}
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:border-primary/60 transition-all"
          >
            {STAGES.filter(s => !['Offer', 'Rejected'].includes(s)).map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Job URL (optional) */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">Job URL <span className="text-on-surface-variant font-normal">(optional)</span></label>
          <input
            {...register('jobUrl')}
            type="url"
            placeholder="https://jobs.example.com/..."
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-on-surface mb-2">Notes <span className="text-on-surface-variant font-normal">(optional)</span></label>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Any extra context about this application..."
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-outline-variant/30 rounded-xl font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Creating...</>
            ) : (
              <><span className="material-symbols-outlined text-base">add_circle</span> Create Process</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
