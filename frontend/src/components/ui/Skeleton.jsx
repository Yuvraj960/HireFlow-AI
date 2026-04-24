export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-surface-container-highest rounded-lg ${className}`}
      {...props}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-surface-container-low rounded-2xl p-6 space-y-4 border border-outline-variant/5">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

export function QuestionSkeleton() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl space-y-3">
      <div className="flex justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <div className="flex gap-2 mt-3">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-lg ml-4" />
      </div>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      </div>
      <div className="flex gap-4 justify-end">
        <div className="space-y-2 w-2/3">
          <Skeleton className="h-12 rounded-2xl" />
        </div>
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      </div>
    </div>
  )
}
