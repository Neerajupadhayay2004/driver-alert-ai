import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, XCircle, CheckCircle, AlertOctagon } from 'lucide-react';
import type { AlertLevel } from '@/types/fatigue';
import { ALERT_MESSAGES } from '@/types/fatigue';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AlertSystemProps {
  level: AlertLevel;
  metrics: {
    perclos: number;
    blinkRate: number;
    yawnFrequency: number;
    noddingDetected: boolean;
  };
}

const alertIcons: Record<AlertLevel, React.ReactNode> = {
  alert: <CheckCircle className="w-6 h-6" />,
  drowsy: <Bell className="w-6 h-6" />,
  fatigued: <AlertTriangle className="w-6 h-6" />,
  severe: <XCircle className="w-6 h-6" />,
  critical: <AlertOctagon className="w-6 h-6" />,
};

const alertStyles: Record<AlertLevel, string> = {
  alert: 'bg-success/20 border-success/50 text-success',
  drowsy: 'bg-warning/20 border-warning/50 text-warning',
  fatigued: 'bg-warning/20 border-warning/50 text-warning',
  severe: 'bg-critical/20 border-critical/50 text-critical',
  critical: 'bg-critical/30 border-critical text-critical animate-pulse',
};

export function AlertSystem({ level, metrics }: AlertSystemProps) {
  const { toast } = useToast();
  const [lastNotifiedLevel, setLastNotifiedLevel] = useState<AlertLevel>('alert');

  useEffect(() => {
    const shouldNotify = 
      (level === 'severe' || level === 'critical') && 
      lastNotifiedLevel !== level;

    if (shouldNotify) {
      toast({
        variant: level === 'critical' ? 'destructive' : 'default',
        title: level === 'critical' ? '🚨 CRITICAL ALERT' : '⚠️ Severe Fatigue Warning',
        description: ALERT_MESSAGES[level],
      });
      setLastNotifiedLevel(level);

      // Play alert sound for critical
      if (level === 'critical') {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleU4WV5vfzYtOMTph3+C6lm06U7v/t2AdOZDp6LyDRTx95v/LZiRXs+/8qmYsQIfz4sOEU0x49/zkbj1Xoubkpm9FHkpq3f7shlxCQ3H2+K5PJHeI7tuJQFh7yPDhezYqWZno4qB0PjVLa9L/wWglQHTn7cCLVDxJd+f/ynIoPo/e5L+QUDdFatrswXAfP5Xr7LiETThGWdfNrWYqU5/k4qtzPjdObdrjpW09Mld81P/ebDs8X3va57Z+SjpIY+f/2XkxOH3W4byMQy5FZOv/12skOJbq68yUWT1EZOP/3XsvPYvi58OUVD5JbOP/3HstQ5Tl58yZX0FMb+T/33wxR5ji4sqhZUZOdfL/4YIxSJPe38ejaktKbOT/4oY1UJXg5M2pcEtNcu3/6Ik1TIvV18+xfU1NY/7/7I07ToPL0c24hU9VYuz/7ZQ7S3nCy9PAmFZRXej/75lCSXK5xNPGolxPXeH/8Zs=');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch (e) {
          // Audio not supported
        }
      }
    }

    if (level === 'alert') {
      setLastNotifiedLevel('alert');
    }
  }, [level, lastNotifiedLevel, toast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Main alert banner */}
      <motion.div
        key={level}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className={cn(
          "glass-card p-4 lg:p-6 border-2 rounded-xl transition-all",
          alertStyles[level]
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl",
            level === 'alert' && "bg-success/20",
            level === 'drowsy' && "bg-warning/20",
            level === 'fatigued' && "bg-warning/20",
            level === 'severe' && "bg-critical/20",
            level === 'critical' && "bg-critical/30"
          )}>
            {alertIcons[level]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg uppercase tracking-wide">
                {level}
              </h3>
              <div className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                level === 'alert' && "bg-success/20",
                level === 'drowsy' && "bg-warning/20",
                level === 'fatigued' && "bg-warning/20",
                level === 'severe' && "bg-critical/20",
                level === 'critical' && "bg-critical/30"
              )}>
                Level {['alert', 'drowsy', 'fatigued', 'severe', 'critical'].indexOf(level) + 1}/5
              </div>
            </div>
            <p className="text-sm opacity-90">{ALERT_MESSAGES[level]}</p>
          </div>
        </div>
      </motion.div>

      {/* Metric triggers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricTrigger 
          label="PERCLOS" 
          value={`${metrics.perclos.toFixed(1)}%`}
          isTriggered={metrics.perclos > 25}
          isCritical={metrics.perclos > 50}
        />
        <MetricTrigger 
          label="Blink Rate" 
          value={`${metrics.blinkRate}/min`}
          isTriggered={metrics.blinkRate < 8 || metrics.blinkRate > 25}
          isCritical={metrics.blinkRate < 5}
        />
        <MetricTrigger 
          label="Yawns" 
          value={`${metrics.yawnFrequency}/min`}
          isTriggered={metrics.yawnFrequency >= 3}
          isCritical={metrics.yawnFrequency >= 5}
        />
        <MetricTrigger 
          label="Nodding" 
          value={metrics.noddingDetected ? 'Yes' : 'No'}
          isTriggered={metrics.noddingDetected}
          isCritical={metrics.noddingDetected && metrics.perclos > 30}
        />
      </div>
    </motion.div>
  );
}

interface MetricTriggerProps {
  label: string;
  value: string;
  isTriggered: boolean;
  isCritical: boolean;
}

function MetricTrigger({ label, value, isTriggered, isCritical }: MetricTriggerProps) {
  return (
    <div className={cn(
      "px-3 py-2 rounded-lg border transition-all text-center",
      !isTriggered && "bg-secondary/30 border-border text-muted-foreground",
      isTriggered && !isCritical && "bg-warning/10 border-warning/30 text-warning",
      isCritical && "bg-critical/10 border-critical/30 text-critical"
    )}>
      <div className="text-xs uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-mono font-bold">{value}</div>
    </div>
  );
}
