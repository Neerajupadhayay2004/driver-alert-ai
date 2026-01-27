import { motion } from 'framer-motion';
import { 
  Eye, 
  EyeOff, 
  Activity, 
  Frown, 
  RotateCcw,
  Zap,
  AlertTriangle
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

  const perclosColor = metrics.perclos >= 50 
    ? 'hsl(var(--critical))' 
    : metrics.perclos >= 25 
      ? 'hsl(var(--warning))' 
      : 'hsl(var(--success))';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Alert Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Driver Status</h2>
        <AlertBadge level={alertLevel} message="" />
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PERCLOS Ring */}
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <p className="metric-label mb-4">PERCLOS</p>
          <ProgressRing 
            value={metrics.perclos} 
            color={perclosColor}
            label="% closed"
            size={140}
          />
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Percentage of Eye Closure
          </p>
        </div>

        {/* Eye Status */}
        <div className="space-y-4">
          <MetricCard
            title="Eye State"
            value={metrics.eyesOpen ? 'Open' : 'Closed'}
            icon={metrics.eyesOpen ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            status={metrics.eyesOpen ? 'normal' : 'warning'}
            subtitle={metrics.faceDetected ? 'Tracking active' : 'No face detected'}
          />
          <MetricCard
            title="Blink Rate"
            value={metrics.blinkRate}
            unit="/min"
            icon={<Activity className="w-5 h-5" />}
            status={getBlinkStatus(metrics.blinkRate)}
            subtitle={`Pattern: ${metrics.blinkPattern}`}
          />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Yawn Count"
          value={metrics.yawnCount}
          icon={<Frown className="w-5 h-5" />}
          status={metrics.yawnFrequency >= 5 ? 'critical' : metrics.yawnFrequency >= 3 ? 'warning' : 'normal'}
          subtitle={`${metrics.yawnFrequency}/min frequency`}
        />
        <MetricCard
          title="Mouth Open"
          value={(metrics.mouthOpenRatio * 100).toFixed(0)}
          unit="%"
          icon={<Zap className="w-5 h-5" />}
          status={metrics.mouthOpenRatio > 0.5 ? 'warning' : 'normal'}
        />
        <MetricCard
          title="Head Nodding"
          value={metrics.noddingDetected ? 'Detected' : 'None'}
          icon={<RotateCcw className="w-5 h-5" />}
          status={metrics.noddingDetected ? 'critical' : 'normal'}
        />
        <MetricCard
          title="Face Status"
          value={metrics.faceDetected ? 'Detected' : 'Lost'}
          icon={<AlertTriangle className="w-5 h-5" />}
          status={metrics.faceDetected ? 'normal' : 'warning'}
        />
      </div>

      {/* Head Pose Values */}
      <div className="glass-card p-4">
        <h3 className="metric-label mb-4">Head Pose Angles</h3>
        <div className="grid grid-cols-3 gap-4">
          <PoseAngle label="Pitch" value={metrics.headPose.pitch} axis="X" />
          <PoseAngle label="Yaw" value={metrics.headPose.yaw} axis="Y" />
          <PoseAngle label="Roll" value={metrics.headPose.roll} axis="Z" />
        </div>
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
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className={cn(
          "text-xs font-medium px-2 py-0.5 rounded",
          axis === 'X' && "bg-critical/20 text-critical",
          axis === 'Y' && "bg-success/20 text-success",
          axis === 'Z' && "bg-primary/20 text-primary"
        )}>
          {axis}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={cn(
        "font-mono text-2xl font-bold",
        isExtreme ? "text-warning" : "text-foreground"
      )}>
        {value > 0 ? '+' : ''}{value}°
      </div>
      <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            axis === 'X' && "bg-critical",
            axis === 'Y' && "bg-success",
            axis === 'Z' && "bg-primary"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${normalized * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
