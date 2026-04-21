"use client";

type Props = {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  color: string;
  size?: number;
};

export default function MacrosRing({
  label,
  value,
  goal,
  unit = "g",
  color,
  size = 110,
}: Props) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const over = value > goal;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-cream)"
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={over ? "#C0544F" : color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-xl font-bold"
            style={{ color: over ? "#C0544F" : "var(--color-dark)" }}
          >
            {Math.round(value)}
          </span>
          <span className="text-[10px] text-brand-warm uppercase tracking-wider">
            / {Math.round(goal)}
            {unit}
          </span>
        </div>
      </div>
      <p className="text-xs font-semibold text-brand-dark mt-2 uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}
