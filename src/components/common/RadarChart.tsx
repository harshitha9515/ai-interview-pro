import React, { useMemo } from 'react';

interface RadarDataPoint {
  label: string;
  value: number; // 0-100
  color?: string;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  size?: number;
  className?: string;
  animate?: boolean;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 280,
  className = '',
  animate = true
}) => {
  const center = size / 2;
  const radius = size * 0.38;
  const levels = 4;

  const points = useMemo(() => {
    return data.map((_, i) => {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle),
        angle
      };
    });
  }, [data, center, radius]);

  const getDataPoints = (scale: number = 1) =>
    data.map((d, i) => {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
      const r = (d.value / 100) * radius * scale;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle)
      };
    });

  const dataPath = getDataPoints()
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ') + ' Z';

  const gridPaths = Array.from({ length: levels }, (_, lvl) => {
    const scale = (lvl + 1) / levels;
    return points
      .map((p, i) => {
        const r = radius * scale;
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ') + ' Z';
  });

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-label="Performance radar chart"
      >
        {/* Grid rings */}
        {gridPaths.map((path, i) => (
          <path
            key={`grid-${i}`}
            d={path}
            fill="none"
            stroke="rgba(99, 102, 241, 0.15)"
            strokeWidth="1"
          />
        ))}

        {/* Axis lines from center */}
        {points.map((p, i) => (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="rgba(99, 102, 241, 0.2)"
            strokeWidth="1"
          />
        ))}

        {/* Filled data area */}
        <path
          d={dataPath}
          fill="rgba(6, 182, 212, 0.12)"
          stroke="rgba(6, 182, 212, 0.8)"
          strokeWidth="2"
          strokeLinejoin="round"
          style={animate ? {
            animation: 'radar-fill 1s ease-out forwards',
          } : {}}
        />

        {/* Data point circles */}
        {getDataPoints().map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#06b6d4"
            stroke="rgba(0,0,0,0.5)"
            strokeWidth="1.5"
          />
        ))}

        {/* Labels */}
        {points.map((p, i) => {
          const labelOffset = 22;
          const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
          const lx = center + (radius + labelOffset) * Math.cos(angle);
          const ly = center + (radius + labelOffset) * Math.sin(angle);
          const textAnchor = Math.cos(angle) > 0.1 ? 'start' : Math.cos(angle) < -0.1 ? 'end' : 'middle';

          return (
            <g key={`label-${i}`}>
              <text
                x={lx}
                y={ly - 4}
                textAnchor={textAnchor}
                fill="#94a3b8"
                fontSize="10"
                fontFamily="system-ui, sans-serif"
                fontWeight="600"
              >
                {data[i].label}
              </text>
              <text
                x={lx}
                y={ly + 9}
                textAnchor={textAnchor}
                fill="#22d3ee"
                fontSize="11"
                fontFamily="system-ui, sans-serif"
                fontWeight="700"
              >
                {data[i].value}%
              </text>
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx={center} cy={center} r={3} fill="rgba(6, 182, 212, 0.5)" />
      </svg>

      <style>{`
        @keyframes radar-fill {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
