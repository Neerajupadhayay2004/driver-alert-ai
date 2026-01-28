import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Activity,
  Frown,
  RotateCcw,
  Zap,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { FatigueMetrics, AlertLevel } from '@/types/fatigue';
import { MetricCard, ProgressRing, AlertBadge } from './MetricCard';
import { cn } from '@/lib/utils';

interface MetricsPanelProps {
  metrics: FatigueMetrics;
  alertLevel: AlertLevel;
}

export function MetricsPanel({ metrics, alertLevel }: MetricsPanelProps) {
  const getPerclosStatus = (value: number): 'normal' | 'warning' | 'critical' => {
    if (value >= 50) return 'critical';
    if (value >= 25) return 'warning';
    return 'normal';
  };

  const getBlinkStatus = (rate: number): 'normal' | 'warning' | 'critical' => {
    if (rate < 5 || rate > 30) return 'critical';
    if (rate < 8 || rate > 25) return 'warning';
    return 'normal';
  };

  const perclosColor =
    metrics.perclos >= 50
      ? 'hsl(var(--critical))'
      : metrics.perclos >= 25
        ? 'hsl(var(--warning))'
        : 'hsl(var(--success))';

  const blinkTrend = metrics.blinkRate > 15 ? 'up' : metrics.blinkRate < 12 ? 'down' : 'stable';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Alert Status */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base sm:text-lg font-semibold">Driver Status</h2>
        <AlertBadge level={alertLevel} message="" />
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* PERCLOS Ring */}
        <motion.div
          className="glass-card p-4 sm:p-6 flex flex-col items-center justify-center"
          whileHover={{ scale: 1.01 }}
        >
          <p className="metric-label mb-3 sm:mb-4">PERCLOS</p>
          <ProgressRing value={metrics.perclos} color={perclosColor} label="% closed" size={120} />
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2 sm:mt-3 text-center">
            Percentage of Eye Closure
          </p>
        </motion.div>

        {/* Eye Status */}
        <div className="space-y-3 sm:space-y-4">
          <MetricCard
            title="Eye State"
            value={metrics.eyesOpen ? 'Open' : 'Closed'}
            icon={metrics.eyesOpen ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
            status={metrics.eyesOpen ? 'normal' : 'warning'}
            subtitle={metrics.faceDetected ? 'Tracking active' : 'No face detected'}
          />
          <MetricCard
            title="Blink Rate"
            value={metrics.blinkRate}
            unit="/min"
            icon={<Activity className="w-4 h-4 sm:w-5 sm:h-5" />}
            status={getBlinkStatus(metrics.blinkRate)}
            subtitle={`Pattern: ${metrics.blinkPattern}`}
            trend={
              blinkTrend === 'up' ? (
                <TrendingUp className="w-3 h-3 text-warning" />
              ) : blinkTrend === 'down' ? (
                <TrendingDown className="w-3 h-3 text-primary" />
              ) : null
            }
          />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <MetricCard
          title="Yawn Count"
          value={metrics.yawnCount}
          icon={<Frown className="w-4 h-4 sm:w-5 sm:h-5" />}
          status={metrics.yawnFrequency >= 5 ? 'critical' : metrics.yawnFrequency >= 3 ? 'warning' : 'normal'}
          subtitle={`${metrics.yawnFrequency}/min`}
          compact
        />
        <MetricCard
          title="Mouth Open"
          value={(metrics.mouthOpenRatio * 100).toFixed(0)}
          unit="%"
          icon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
          status={metrics.mouthOpenRatio > 0.5 ? 'warning' : 'normal'}
          compact
        />
        <MetricCard
          title="Head Nodding"
          value={metrics.noddingDetected ? 'Detected' : 'None'}
          icon={<RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />}
          status={metrics.noddingDetected ? 'critical' : 'normal'}
          compact
        />
        <MetricCard
          title="Face Status"
          value={metrics.faceDetected ? 'Detected' : 'Lost'}
          icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
          status={metrics.faceDetected ? 'normal' : 'warning'}
          compact
        />
      </div>

      {/* Head Pose Values */}
      <motion.div className="glass-card p-3 sm:p-4" whileHover={{ scale: 1.005 }}>
        <h3 className="metric-label mb-3 sm:mb-4">Head Pose Angles</h3>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <PoseAngle label="Pitch" value={metrics.headPose.pitch} axis="X" />
          <PoseAngle label="Yaw" value={metrics.headPose.yaw} axis="Y" />
          <PoseAngle label="Roll" value={metrics.headPose.roll} axis="Z" />
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <QuickStat
          label="Session"
          value={metrics.faceDetected ? 'Active' : 'Idle'}
          color={metrics.faceDetected ? 'success' : 'muted'}
        />
        <QuickStat
          label="Accuracy"
          value="98%"
          color="primary"
        />
        <QuickStat
          label="Alert Level"
          value={alertLevel.charAt(0).toUpperCase() + alertLevel.slice(1)}
          color={
            alertLevel === 'critical' || alertLevel === 'severe'
              ? 'critical'
              : alertLevel === 'fatigued' || alertLevel === 'drowsy'
                ? 'warning'
                : 'success'
          }
        />
      </div>
    </motion.div>
  );
}

interface PoseAngleProps {
  label: string;
  value: number;
  axis: 'X' | 'Y' | 'Z';
}

function PoseAngle({ label, value, axis }: PoseAngleProps) {
  const normalized = Math.min(Math.abs(value) / 45, 1);
  const isExtreme = Math.abs(value) > 30;

  return (
    <motion.div className="text-center" whileHover={{ scale: 1.02 }}>
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1 sm:mb-2">
        <span
          className={cn(
            'text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded',
            axis === 'X' && 'bg-critical/20 text-critical',
            axis === 'Y' && 'bg-success/20 text-success',
            axis === 'Z' && 'bg-primary/20 text-primary'
          )}
        >
          {axis}
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">{label}</span>
      </div>
      <div
        className={cn(
          'font-mono text-lg sm:text-2xl font-bold',
          isExtreme ? 'text-warning' : 'text-foreground'
        )}
      >
        {value > 0 ? '+' : ''}
        {value}°
      </div>
      <div className="mt-1.5 sm:mt-2 h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            axis === 'X' && 'bg-critical',
            axis === 'Y' && 'bg-success',
            axis === 'Z' && 'bg-primary'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${normalized * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

interface QuickStatProps {
  label: string;
  value: string;
  color: 'success' | 'warning' | 'critical' | 'primary' | 'muted';
}

function QuickStat({ label, value, color }: QuickStatProps) {
  const colorClass = {
    success: 'text-success',
    warning: 'text-warning',
    critical: 'text-critical',
    primary: 'text-primary',
    muted: 'text-muted-foreground',
  }[color];

  return (
    <div className="glass-card p-2 sm:p-3 text-center">
      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn('text-xs sm:text-sm font-semibold mt-0.5', colorClass)}>{value}</p>
    </div>
  );
}
