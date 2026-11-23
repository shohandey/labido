import { Beaker } from 'lucide-react';

export default function DemoBadge({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-[#a855f7] text-white rounded tracking-wider ${className}`}>
      <Beaker className="w-3 h-3" />
      DEMO DATA
    </span>
  );
}
