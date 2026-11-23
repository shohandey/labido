import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

export default function EquipmentCard({ item }) {
  const navigate = useNavigate();
  const isAvailable = item.available > 0;

  return (
    <div
      className="card p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
      onClick={() => navigate(`/equipment/${item.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/equipment/${item.id}`)}
    >
      {/* Top row: emoji + availability */}
      <div className="flex items-start justify-between">
        <div className="text-4xl leading-none select-none" aria-hidden="true">
          {item.emoji}
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            isAvailable
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {isAvailable ? `${item.available} available` : 'Unavailable'}
        </span>
      </div>

      {/* Name & department */}
      <div>
        <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
          {item.name}
        </h3>
        <p className="text-xs text-blue-600 font-medium mt-1">{item.department}</p>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
        {item.shortDescription}
      </p>

      {/* Footer: location + CTA */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <MapPin size={11} />
          <span className="truncate max-w-[140px]">{item.lab.split('—')[0].trim()}</span>
        </div>
        <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
          View details <ArrowRight size={12} />
        </span>
      </div>
    </div>
  );
}
