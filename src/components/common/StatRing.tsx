import React from 'react';

interface StatRingProps {
  score: number; // 0 - 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const StatRing: React.FC<StatRingProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
  label = 'Overall Score',
  sublabel = 'out of 100'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validScore = Math.max(0, Math.min(100, isNaN(score) ? 0 : score));
  const strokeDashoffset = circumference - (validScore / 100) * circumference;

  const getColor = () => {
    if (validScore >= 85) return { stroke: '#10b981', text: 'text-emerald-400', glow: 'rgba(16,185,129,0.3)' };
    if (validScore >= 70) return { stroke: '#06b6d4', text: 'text-cyan-400', glow: 'rgba(6,182,212,0.3)' };
    if (validScore >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', glow: 'rgba(245,158,11,0.3)' };
    return { stroke: '#f43f5e', text: 'text-rose-400', glow: 'rgba(244,63,94,0.3)' };
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
              filter: `drop-shadow(0 0 8px ${color.glow})`
            }}
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-3xl md:text-4xl font-extrabold tracking-tight ${color.text}`}>
            {validScore}
          </span>
          {sublabel && (
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {sublabel}
            </span>
          )}
        </div>
      </div>
      {label && (
        <span className="mt-2 text-sm font-semibold text-slate-200">
          {label}
        </span>
      )}
    </div>
  );
};
