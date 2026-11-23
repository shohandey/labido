const statusConfig = {
  pending: {
    label: 'Pending review',
    classes: 'bg-amber-50 text-amber-700 border-amber-100',
    dot: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-green-50 text-green-700 border-green-100',
    dot: 'bg-green-500',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-red-50 text-red-700 border-red-100',
    dot: 'bg-red-500',
  },
  'alternative-suggested': {
    label: 'Alternative suggested',
    classes: 'bg-blue-50 text-blue-700 border-blue-100',
    dot: 'bg-blue-500',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-slate-50 text-slate-500 border-slate-100',
    dot: 'bg-slate-400',
  },
};

export default function StatusBadge({ status, size = 'sm' }) {
  const cfg = statusConfig[status] || {
    label: status,
    classes: 'bg-slate-50 text-slate-600 border-slate-100',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full px-2.5 py-0.5 ${cfg.classes} ${
        size === 'xs' ? 'text-xs' : 'text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
