export default function LabidoLogo({
  variant = 'navbar', // 'navbar' | 'full' | 'icon'
  className = '',
  iconSize = 36,
  showTagline = true,
}) {
  const iconSvg = (
    <svg
      viewBox="0 0 120 120"
      width={iconSize}
      height={iconSize}
      className="shrink-0"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="labidoGradReact" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" />
          <stop offset="55%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="labidoGlowReact" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
        <linearGradient id="liquidGradReact" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.08" />
        </linearGradient>
      </defs>

      {/* Back orbit arc */}
      <path
        d="M 32 40 C 44 26 78 24 98 38 C 110 47 110 59 96 70"
        stroke="url(#labidoGradReact)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.45"
      />

      {/* Liquid inside flask */}
      <path
        d="M 35 68 Q 60 72 85 68 L 90.5 83.5 C 92.5 87.5 89.5 90 85.5 90 L 34.5 90 C 30.5 90 27.5 87.5 29.5 83.5 Z"
        fill="url(#liquidGradReact)"
      />
      <path
        d="M 35 68 Q 60 71 85 68"
        stroke="url(#labidoGlowReact)"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.85"
      />

      {/* Flask outline */}
      <path
        d="M 52 20 L 52 38 L 27.5 85 C 25.5 89 28.5 91.5 33 91.5 L 87 91.5 C 91.5 91.5 94.5 89 92.5 85 L 68 38 L 68 20 Z"
        stroke="url(#labidoGradReact)"
        strokeWidth="3.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="48" y="16" width="24" height="4.5" rx="2.25" fill="url(#labidoGradReact)" />

      {/* Molecular network bonds */}
      <line x1="43" y1="56" x2="60" y2="63" stroke="url(#labidoGradReact)" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <line x1="77" y1="53" x2="60" y2="63" stroke="url(#labidoGradReact)" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <line x1="60" y1="63" x2="60" y2="80" stroke="url(#labidoGradReact)" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <line x1="60" y1="80" x2="42" y2="81" stroke="url(#labidoGradReact)" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <line x1="60" y1="80" x2="78" y2="79" stroke="url(#labidoGradReact)" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <line x1="43" y1="56" x2="42" y2="81" stroke="url(#labidoGradReact)" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
      <line x1="77" y1="53" x2="78" y2="79" stroke="url(#labidoGradReact)" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />

      {/* Molecular nodes */}
      <circle cx="43" cy="56" r="3.5" fill="url(#labidoGradReact)" />
      <circle cx="77" cy="53" r="3.5" fill="url(#labidoGradReact)" />
      <circle cx="42" cy="81" r="3.2" fill="url(#labidoGradReact)" />
      <circle cx="78" cy="79" r="3.2" fill="url(#labidoGradReact)" />
      <circle cx="60" cy="80" r="3.8" fill="url(#labidoGlowReact)" />

      {/* Center 4-point sparkle */}
      <path
        d="M 60 55.5 Q 60 63 52.5 63 Q 60 63 60 70.5 Q 60 63 67.5 63 Q 60 63 60 55.5 Z"
        fill="url(#labidoGlowReact)"
      />
      <circle cx="60" cy="63" r="1.5" fill="#ffffff" />

      {/* Orbit wrapping around flask */}
      <path
        d="M 12 66 C 10 51 32 36 62 33 C 94 30 114 41 112 56 C 110 71 88 84 58 87 C 32 90 14 81 12 66"
        stroke="url(#labidoGradReact)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="106" cy="46" r="3.2" fill="url(#labidoGlowReact)" />
      <circle cx="14" cy="72" r="2.8" fill="url(#labidoGradReact)" />

      {/* Accent mini-sparkle */}
      <path
        d="M 94 28 Q 94 32 90 32 Q 94 32 94 36 Q 94 32 98 32 Q 94 32 94 28 Z"
        fill="url(#labidoGlowReact)"
        opacity="0.9"
      />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{iconSvg}</div>;
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <div className="p-3 bg-gradient-to-b from-sky-50 to-teal-50/40 rounded-2xl border border-sky-100 shadow-sm mb-3">
          {iconSvg}
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-sky-600 via-blue-600 to-teal-500 bg-clip-text text-transparent leading-none">
          Labido
        </h1>
        <p className="mt-2 text-xs sm:text-sm font-bold tracking-[0.24em] text-sky-700 uppercase">
          CAMPUS LAB NETWORK
        </p>
        {showTagline && (
          <p className="mt-1 text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
            INTELLIGENT RESOURCE PLATFORM
          </p>
        )}
      </div>
    );
  }

  // Default: 'navbar' / compact
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        {iconSvg}
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
          Labido
        </span>
        <span className="text-[8px] font-bold tracking-[0.18em] text-sky-700 uppercase mt-0.5">
          Campus Lab Network
        </span>
      </div>
    </div>
  );
}
