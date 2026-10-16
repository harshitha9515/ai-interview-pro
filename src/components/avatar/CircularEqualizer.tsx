import React, { useMemo } from 'react';
import { AIStatus } from '../../types/interview';

interface CircularEqualizerProps {
  status: AIStatus;
  audioLevel: number; // 0.0 to 1.0
  frequencyData?: Uint8Array;
  size?: number; // pixel size of outer ring
  barCount?: number;
}

export const CircularEqualizer: React.FC<CircularEqualizerProps> = ({
  status,
  audioLevel,
  frequencyData,
  size = 320,
  barCount = 36
}) => {
  const center = size / 2;
  const baseRadius = (size * 0.42); // radius where equalizer bars start
  const maxBarLength = size * 0.12;

  // Color scheme per status
  const theme = useMemo(() => {
    switch (status) {
      case 'speaking':
        return {
          stroke: '#a855f7',
          glow: 'rgba(168, 85, 247, 0.6)',
          gradientId: 'eq-speaking',
          stops: [
            { offset: '0%', color: '#06b6d4' },
            { offset: '50%', color: '#8b5cf6' },
            { offset: '100%', color: '#ec4899' }
          ]
        };
      case 'listening':
        return {
          stroke: '#22d3ee',
          glow: 'rgba(34, 211, 238, 0.6)',
          gradientId: 'eq-listening',
          stops: [
            { offset: '0%', color: '#38bdf8' },
            { offset: '100%', color: '#06b6d4' }
          ]
        };
      case 'thinking':
      case 'analyzing':
        return {
          stroke: '#c084fc',
          glow: 'rgba(192, 132, 252, 0.5)',
          gradientId: 'eq-thinking',
          stops: [
            { offset: '0%', color: '#818cf8' },
            { offset: '100%', color: '#a855f7' }
          ]
        };
      case 'error':
        return {
          stroke: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.6)',
          gradientId: 'eq-error',
          stops: [
            { offset: '0%', color: '#f59e0b' },
            { offset: '100%', color: '#f43f5e' }
          ]
        };
      case 'idle':
      default:
        return {
          stroke: '#38bdf8',
          glow: 'rgba(56, 189, 248, 0.25)',
          gradientId: 'eq-idle',
          stops: [
            { offset: '0%', color: '#38bdf8' },
            { offset: '100%', color: '#6366f1' }
          ]
        };
    }
  }, [status]);

  // Compute radial bars
  const bars = useMemo(() => {
    const arr = [];
    const angleStep = (2 * Math.PI) / barCount;

    for (let i = 0; i < barCount; i++) {
      const angle = i * angleStep;
      // Get frequency or compute procedural variation
      let barIntensity = audioLevel;
      if (frequencyData && frequencyData.length > 0) {
        const freqIdx = Math.min(frequencyData.length - 1, Math.floor((i / barCount) * frequencyData.length));
        const freqVal = frequencyData[freqIdx] / 255;
        barIntensity = Math.max(audioLevel * 0.4, freqVal * 0.8 + audioLevel * 0.4);
      } else if (status === 'speaking' || status === 'listening') {
        const harmonic = Math.sin(angle * 3 + Date.now() * 0.005) * 0.25 + 0.75;
        barIntensity = Math.min(1.0, audioLevel * harmonic);
      } else if (status === 'thinking' || status === 'analyzing') {
        // Rotating wave effect
        const wave = Math.sin(angle * 2 + Date.now() * 0.003) * 0.5 + 0.5;
        barIntensity = wave * 0.35 + 0.1;
      } else if (status === 'error') {
        barIntensity = 0.2;
      } else {
        // Idle gentle breathing rhythm
        barIntensity = 0.08 + Math.sin(angle + Date.now() * 0.002) * 0.05;
      }

      const length = Math.max(3, barIntensity * maxBarLength);
      const innerX = center + Math.cos(angle) * baseRadius;
      const innerY = center + Math.sin(angle) * baseRadius;
      const outerX = center + Math.cos(angle) * (baseRadius + length);
      const outerY = center + Math.sin(angle) * (baseRadius + length);

      arr.push({
        id: i,
        x1: innerX,
        y1: innerY,
        x2: outerX,
        y2: outerY,
        opacity: Math.max(0.2, Math.min(0.95, barIntensity * 1.2)),
        width: barIntensity > 0.4 ? 2.5 : 1.8
      });
    }
    return arr;
  }, [barCount, center, baseRadius, maxBarLength, audioLevel, frequencyData, status]);

  return (
    <div 
      className="absolute inset-0 pointer-events-none flex items-center justify-center select-none"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg 
        width={size} 
        height={size} 
        viewBox={`0 0 ${size} ${size}`} 
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={theme.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {theme.stops.map((s, idx) => (
              <stop key={idx} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
          <filter id={`glow-${theme.gradientId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Outer Circular Aura Ring */}
        <circle
          cx={center}
          cy={center}
          r={baseRadius}
          fill="none"
          stroke={`url(#${theme.gradientId})`}
          strokeWidth="1.5"
          strokeDasharray={status === 'thinking' ? '6 6' : 'none'}
          className={status === 'thinking' ? 'animate-spin' : ''}
          style={{ 
            animationDuration: '14s',
            opacity: status === 'speaking' || status === 'listening' ? 0.7 : 0.35,
            filter: `drop-shadow(0 0 6px ${theme.glow})`
          }}
        />

        {/* Ambient Pulsing Glow Circle */}
        <circle
          cx={center}
          cy={center}
          r={baseRadius + (audioLevel * 14)}
          fill="none"
          stroke={`url(#${theme.gradientId})`}
          strokeWidth="1"
          opacity={Math.min(0.5, audioLevel * 0.7)}
          className="transition-all duration-150"
        />

        {/* Radial Equalizer Bars */}
        <g filter={`url(#glow-${theme.gradientId})`}>
          {bars.map(bar => (
            <line
              key={bar.id}
              x1={bar.x1}
              y1={bar.y1}
              x2={bar.x2}
              y2={bar.y2}
              stroke={`url(#${theme.gradientId})`}
              strokeWidth={bar.width}
              strokeLinecap="round"
              opacity={bar.opacity}
              className="transition-all duration-75"
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
