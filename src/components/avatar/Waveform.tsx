import React from 'react';

interface WaveformProps {
  active: boolean;
  color?: 'cyan' | 'violet' | 'emerald';
  barCount?: number;
  height?: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  active,
  color = 'cyan',
  barCount = 12,
  height = 36
}) => {
  const colorMap = {
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]',
    violet: 'bg-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]',
    emerald: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
  };

  return (
    <div 
      className="flex items-center justify-center gap-1"
      style={{ height: `${height}px` }}
      aria-label="Audio waveform indicator"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        const delay = (i * 0.1).toFixed(2);
        const duration = (0.6 + (i % 4) * 0.2).toFixed(2);
        const randomHeightPercent = active ? 30 + ((i * 17) % 70) : 15;

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${colorMap[color]}`}
            style={{
              height: active ? `${randomHeightPercent}%` : '15%',
              animation: active ? `sound-bar ${duration}s ease-in-out ${delay}s infinite alternate` : 'none',
              opacity: active ? 0.9 : 0.3
            }}
          />
        );
      })}
    </div>
  );
};
