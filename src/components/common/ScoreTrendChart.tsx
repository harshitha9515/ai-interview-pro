import React, { useMemo } from 'react';

interface TrendPoint {
  label: string;
  score: number;
}

interface ScoreTrendChartProps {
  data: TrendPoint[];
  width?: number;
  height?: number;
  className?: string;
}

export const ScoreTrendChart: React.FC<ScoreTrendChartProps> = ({
  data,
  width = 400,
  height = 120,
  className = ''
}) => {
  const padding = { top: 12, right: 16, bottom: 28, left: 32 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const { minScore, maxScore, points, areaPath, linePath } = useMemo(() => {
    if (data.length === 0) {
      return { minScore: 0, maxScore: 100, points: [], areaPath: '', linePath: '' };
    }

    const scores = data.map(d => d.score);
    const minScore = Math.max(0, Math.min(...scores) - 10);
    const maxScore = Math.min(100, Math.max(...scores) + 10);

    const toX = (i: number) => (i / Math.max(data.length - 1, 1)) * chartW;
    const toY = (v: number) => chartH - ((v - minScore) / (maxScore - minScore)) * chartH;

    const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.score), score: d.score, label: d.label }));

    const linePath = pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const areaPath = linePath
      + ` L ${(pts[pts.length - 1]?.x ?? 0).toFixed(1)} ${chartH.toFixed(1)}`
      + ` L 0 ${chartH.toFixed(1)} Z`;

    return { minScore, maxScore, points: pts, areaPath, linePath };
  }, [data, chartW, chartH]);

  if (data.length < 2) {
    return (
      <div className={`flex items-center justify-center text-xs text-slate-500 ${className}`} style={{ width, height }}>
        Complete at least 2 interviews to see your score trend.
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-label="Score progression chart"
    >
      <defs>
        <linearGradient id="trend-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="trend-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      <g transform={`translate(${padding.left}, ${padding.top})`}>

        {/* Horizontal guide lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = chartH - (pct / 100) * chartH;
          return (
            <g key={pct}>
              <line x1={0} y1={y} x2={chartW} y2={y}
                stroke="rgba(99,102,241,0.12)" strokeWidth="1" strokeDasharray="4 3" />
              <text x={-4} y={y + 4} textAnchor="end" fill="#64748b" fontSize="8">{pct}</text>
            </g>
          );
        })}

        {/* Filled area */}
        <path d={areaPath} fill="url(#trend-area-grad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="url(#trend-line-grad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#06b6d4" stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" />
            <text
              x={p.x}
              y={chartH + 18}
              textAnchor="middle"
              fill="#64748b"
              fontSize="9"
              fontFamily="system-ui"
            >
              #{i + 1}
            </text>
            {/* Score tooltip above point */}
            {i === points.length - 1 && (
              <g>
                <rect
                  x={p.x - 16}
                  y={p.y - 22}
                  width={32}
                  height={16}
                  rx={4}
                  fill="rgba(6, 182, 212, 0.15)"
                  stroke="rgba(6, 182, 212, 0.5)"
                  strokeWidth="1"
                />
                <text
                  x={p.x}
                  y={p.y - 9}
                  textAnchor="middle"
                  fill="#22d3ee"
                  fontSize="9"
                  fontWeight="700"
                >
                  {p.score}%
                </text>
              </g>
            )}
          </g>
        ))}

      </g>
    </svg>
  );
};
