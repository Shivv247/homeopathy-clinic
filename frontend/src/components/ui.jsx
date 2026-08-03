import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin text-sage-600 ${className}`} size={24} />;
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="w-8 h-8" />
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-sage-100/80 ${className}`} />;
}

export function StatSkeleton() {
  return (
    <div className="card-surface p-4 space-y-2">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="card-surface p-10 text-center">
      <p className="font-display text-lg text-sage-800">{title}</p>
      {description && <p className="text-muted mt-2 text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function TagBadge({ tag }) {
  const styles = {
    NEW: 'bg-sky-100 text-sky-800',
    FOLLOW_UP: 'bg-sage-100 text-sage-800',
    INACTIVE: 'bg-stone-100 text-stone-600',
    VIP: 'bg-amber-100 text-amber-800',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${styles[tag] || styles.NEW}`}>
      {tag?.replace('_', '-')}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    SCHEDULED: 'bg-sky-100 text-sky-800',
    ARRIVED: 'bg-amber-100 text-amber-800',
    IN_CONSULTATION: 'bg-violet-100 text-violet-800',
    COMPLETED: 'bg-sage-100 text-sage-800',
    NO_SHOW: 'bg-stone-100 text-stone-600',
    CANCELLED: 'bg-red-100 text-red-700',
    PAID: 'bg-sage-100 text-sage-800',
    PARTIAL: 'bg-amber-100 text-amber-800',
    PENDING: 'bg-orange-100 text-orange-800',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${styles[status] || 'bg-stone-100'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

export function ChipSelect({ options, value, onChange, multi = false }) {
  const selected = multi ? (value || []) : value;

  const toggle = (opt) => {
    if (multi) {
      const next = selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt];
      onChange(next);
    } else {
      onChange(selected === opt ? '' : opt);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = multi ? selected.includes(opt) : selected === opt;
        return (
          <button
            key={opt}
            type="button"
            className={`chip ${active ? 'chip-active' : 'chip-idle'}`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
