import { motion } from 'framer-motion';
import type { AlertLevel } from '@/types/fatigue';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  status?: 'normal' | 'warning' | 'critical';
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
}

const statusStyles = {
  normal: 'text-success border-success/30',
  warning: 'text-warning border-warning/30',
  critical: 'text-critical border-critical/30 animate-pulse',
};

const statusGlow = {
  normal: 'glow-success',
  warning: 'glow-warning',
  critical: 'glow-critical',
};

export function MetricCard({ 
  title, 
  value, 
  unit, 
  icon, 
  status = 'normal',
  subtitle,
  trend 
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass-card p-4 lg:p-6 relative overflow-hidden",
        status === 'critical' && "border-critical/50"
      )}
    >
      {/* Background glow */}
      <div 
        className={cn(
          "absolute inset-0 opacity-10 blur-3xl",
          status === 'normal' && "bg-success",
          status === 'warning' && "bg-warning",
          status === 'critical' && "bg-critical"
        )}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={cn("p-2 rounded-lg bg-secondary/50", statusStyles[status])}>
            {icon}
          </div>
          {trend && (
            <div className={cn(
              "text-xs font-medium",
              trend === 'up' && "text-critical",
              trend === 'down' && "text-success",
              trend === 'stable' && "text-muted-foreground"
            )}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'stable' && '→'}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="metric-label">{title}</p>
          <div className="flex items-baseline gap-1">
            <span className={cn("metric-value", statusStyles[status])}>
              {value}
            </span>
            {unit && (
              <span className="text-lg text-muted-foreground">{unit}</span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface AlertBadgeProps {
  level: AlertLevel;
  message: string;
}

export function AlertBadge({ level, message }: AlertBadgeProps) {
  const levelStyles: Record<AlertLevel, string> = {
    alert: 'badge-safe',
    drowsy: 'badge-warning',
    fatigued: 'badge-warning',
    severe: 'badge-critical',
    critical: 'badge-critical',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium",
        levelStyles[level]
      )}
    >
      <span className={cn(
        "w-2 h-2 rounded-full",
        level === 'alert' && "bg-success",
        level === 'drowsy' && "bg-warning",
        level === 'fatigued' && "bg-warning",
        level === 'severe' && "bg-critical animate-pulse",
        level === 'critical' && "bg-critical animate-pulse"
      )} />
      <span className="uppercase text-sm tracking-wide">{level}</span>
    </motion.div>
  );
}

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

export function ProgressRing({ 
  value, 
  max = 100, 
  size = 120, 
  strokeWidth = 8,
  color = 'hsl(var(--primary))',
  label
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
          style={{
            filter: `drop-shadow(0 0 10px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="metric-value text-2xl" style={{ color }}>
          {Math.round(value)}
        </span>
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
}
