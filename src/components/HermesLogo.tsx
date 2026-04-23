import React from 'react';

interface HermesLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const HermesLogo: React.FC<HermesLogoProps> = ({ className, size = 48, showText = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Main Shield / Diamond Frame */}
          <path
            d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
            stroke="currentColor"
            strokeWidth="2"
            className="opacity-20"
          />
          
          {/* Stylized 'H' with Wings / Data flow */}
          <path
            d="M35 30V70M65 30V70M35 50H65"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-400"
          />
          
          {/* Winged elements / Connection nodes */}
          <path
            d="M35 35L20 20M35 65L20 80M65 35L80 20M65 65L80 80"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="opacity-60"
          />
          
          {/* Central AI node */}
          <circle cx="50" cy="50" r="10" fill="currentColor" className="text-indigo-600 animate-pulse" />
          <circle cx="50" cy="50" r="14" stroke="currentColor" strokeWidth="1" className="text-indigo-600/30 animate-ping" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tighter leading-none text-slate-100 italic">HERMES</span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
          </div>
          <span className="text-[7px] font-black tracking-[0.3em] text-indigo-400 uppercase opacity-80 mt-1">
            INTELLIGENCE & ANALYSIS SUITE
          </span>
        </div>
      )}
    </div>
  );
};
