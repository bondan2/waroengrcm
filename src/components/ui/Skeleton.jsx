import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <div className="card-premium p-4 space-y-4">
      <div className="skeleton h-48 rounded-xl" />
      <div className="space-y-2">
        <div className="skeleton h-4 w-3/4 rounded-lg" />
        <div className="skeleton h-4 w-1/2 rounded-lg" />
      </div>
      <div className="flex justify-between items-center">
        <div className="skeleton h-6 w-20 rounded-lg" />
        <div className="skeleton h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(4)].map((_, j) => (
            <div key={j} className="skeleton h-12 flex-1 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return <div className="skeleton h-80 rounded-2xl" />;
}

// Add to index.css:
// .skeleton { @apply bg-warm-200 animate-pulse; }