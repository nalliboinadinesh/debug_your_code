import React from 'react';

interface DycLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export const DycLogo: React.FC<DycLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Brand Icon SVG */}
      <div className={`relative ${iconSizes[size]} flex-shrink-0 group cursor-pointer`}>
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 opacity-40 blur-md group-hover:opacity-75 transition duration-500" />
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full transform transition group-hover:scale-105"
        >
          <defs>
            <linearGradient id="dycNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <filter id="navGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hexagon/Chip base */}
          <rect
            x="4"
            y="4"
            width="56"
            height="56"
            rx="14"
            fill="#0b111e"
            stroke="#1e293b"
            strokeWidth="2"
          />
          <rect
            x="6"
            y="6"
            width="52"
            height="52"
            rx="12"
            fill="none"
            stroke="url(#dycNavGrad)"
            strokeWidth="1.2"
            strokeOpacity="0.4"
          />

          {/* Left bracket < */}
          <path
            d="M23 23 L14 32 L23 41"
            stroke="url(#dycNavGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#navGlow)"
          />

          {/* Right bracket > */}
          <path
            d="M41 23 L50 32 L41 41"
            stroke="url(#dycNavGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#navGlow)"
          />

          {/* Execution Core Pulse */}
          <circle cx="32" cy="32" r="4.5" fill="#00f0ff" filter="url(#navGlow)" />
          <circle cx="32" cy="32" r="2" fill="#ffffff" />

          {/* Connectors */}
          <path d="M22 32 L26 32" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M38 32 L42 32" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-tight ${textSizes[size]} bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent`}
            >
              DebugYourCode
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              DYC
            </span>
          </div>
          <span className="text-[10px] tracking-wider text-slate-400 uppercase font-medium mt-0.5">
            Dynamic 3D Execution IDE
          </span>
        </div>
      )}
    </div>
  );
};
