import { CheckCircle, ArrowRight, Calendar, Clock } from 'lucide-react';

export default function SuggestionCard({ suggestion, onAccept }) {
  const typeLabel = {
    'same-equipment-different-time': 'Different time, same equipment',
    'same-equipment-different-day': 'Different day, same equipment',
    'alternative-equipment': 'Similar equipment available',
    'similar-equipment': 'Related equipment available',
  };

  const fmtDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });

  const fmtTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    const period = h < 12 ? 'AM' : 'PM';
    const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  };

  return (
    <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="text-2xl leading-none mt-0.5 select-none" aria-hidden="true">
          {suggestion.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
            {typeLabel[suggestion.type] || 'Alternative'}
          </span>
          <h4 className="font-semibold text-slate-900 text-sm mt-0.5 leading-snug">
            {suggestion.equipmentName}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{suggestion.lab.split('—')[0].trim()}</p>
        </div>
      </div>

      {/* Time slot */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-700">
        <span className="flex items-center gap-1.5">
          <Calendar size={12} className="text-blue-500" />
          {fmtDate(suggestion.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} className="text-blue-500" />
          {fmtTime(suggestion.startTime)} – {fmtTime(suggestion.endTime)}
        </span>
      </div>

      {/* Explanation */}
      <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-blue-300 pl-3 italic">
        "{suggestion.explanation}"
      </p>

      {/* CTA */}
      {onAccept && (
        <button
          onClick={() => onAccept(suggestion)}
          className="self-start btn-primary text-xs py-1.5 px-3"
        >
          <CheckCircle size={13} />
          Book this instead
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}
