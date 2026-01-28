import { motion } from 'framer-motion';
import type { AlertLevel } from '@/types/fatigue';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  status?: 'normal' | 'warning' | 'critical';
  subtitle?: string;
  trend?: ReactNode;
  compact?: boolean;
}

const statusStyles = {
  normal: 'text-success border-success/30',
  warning: 'text-warning border-warning/30',
  critical: 'text-critical border-critical/30 animate-pulse',
};

const iconColors = {
  normal: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  critical: 'text-critical bg-critical/10',
};

export function MetricCard({
  title,
  value,
  unit,
  icon,
  status = 'normal',
  subtitle,
  trend,
  compact = false,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(
        'glass-card relative overflow-hidden border transition-all',
        status === 'normal' && 'border-success/20 bg-success/5',
        status === 'warning' && 'border-warning/20 bg-warning/5',
        status === 'critical' && 'border-critical/30 bg-critical/5',
        compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4'
      )}
    >
      {/* Background glow */}
      <div
        className={cn(
          'absolute inset-0 opacity-10 blur-3xl',
          status === 'normal' && 'bg-success',
          status === 'warning' && 'bg-warning',
          status === 'critical' && 'bg-critical'
        )}
      />

      <div className={cn('relative z-10', compact && 'flex flex-col items-center text-center')}>
        <div className={cn('flex items-start gap-2 sm:gap-3', compact && 'flex-col items-center')}>
          <div className={cn('p-1.5 sm:p-2 rounded-lg shrink-0', iconColors[status])}>
            {icon}
          </div>
          <div className={cn('flex-1 min-w-0', compact && 'w-full')}>
            <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider truncate">
              {title}
            </p>
            <div className={cn('flex items-baseline gap-1 mt-0.5 sm:mt-1', compact && 'justify-center')}>
              <span
                className={cn(
                  'font-bold',
                  compact ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl',
                  statusStyles[status]
                )}
              >
                {value}
              </span>
              {unit && <span className="text-xs sm:text-sm text-muted-foreground">{unit}</span>}
              {trend && <span className="ml-1">{trend}</span>}
            </div>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface AlertBadgeProps {
  level: AlertLevel;
  message: string;
}

const badgeStyles: Record<AlertLevel, string> = {
  alert: 'bg-success/20 text-success border-success/30',
  drowsy: 'bg-warning/20 text-warning border-warning/30',
  fatigued: 'bg-warning/20 text-warning border-warning/30',
  severe: 'bg-critical/20 text-critical border-critical/30',
  critical: 'bg-critical/30 text-critical border-critical animate-pulse',
};

export function AlertBadge({ level, message }: AlertBadgeProps) {
  return (
    <motion.div
      key={level}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border text-xs sm:text-sm font-medium',
        badgeStyles[level]
      )}
    >
      <motion.div
        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <span className="uppercase tracking-wider text-[10px] sm:text-xs">{level}</span>
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
  label,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(value / max, 1);
  const offset = circumference - percent * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
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
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-2xl sm:text-3xl font-bold"
          key={value}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {value.toFixed(1)}
        </motion.span>
        {label && <span className="text-[10px] sm:text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
}
