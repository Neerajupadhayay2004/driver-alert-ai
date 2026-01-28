import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell, XCircle, CheckCircle, AlertOctagon, Volume2, VolumeX } from 'lucide-react';
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
  alert: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
  drowsy: <Bell className="w-5 h-5 sm:w-6 sm:h-6" />,
  fatigued: <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />,
  severe: <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
  critical: <AlertOctagon className="w-5 h-5 sm:w-6 sm:h-6" />,
};

const alertStyles: Record<AlertLevel, string> = {
  alert: 'bg-success/10 border-success/40 text-success',
  drowsy: 'bg-warning/10 border-warning/40 text-warning',
  fatigued: 'bg-warning/15 border-warning/50 text-warning',
  severe: 'bg-critical/15 border-critical/50 text-critical',
  critical: 'bg-critical/20 border-critical text-critical animate-pulse',
};

const alertBgStyles: Record<AlertLevel, string> = {
  alert: 'bg-success/15',
  drowsy: 'bg-warning/15',
  fatigued: 'bg-warning/20',
  severe: 'bg-critical/15',
  critical: 'bg-critical/25',
};

export function AlertSystem({ level, metrics }: AlertSystemProps) {
  const { toast } = useToast();
  const [lastNotifiedLevel, setLastNotifiedLevel] = useState<AlertLevel>('alert');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleU4WV5vfzYtOMTph3+C6lm06U7v/t2AdOZDp6LyDRTx95v/LZiRXs+/8qmYsQIfz4sOEU0x49/zkbj1Xoubkpm9FHkpq3f7shlxCQ3H2+K5PJHeI7tuJQFh7yPDhezYqWZno4qB0PjVLa9L/wWglQHTn7cCLVDxJd+f/ynIoPo/e5L+QUDdFatrswXAfP5Xr7LiETThGWdfNrWYqU5/k4qtzPjdObdrjpW09Mld81P/ebDs8X3va57Z+SjpIY+f/2XkxOH3W4byMQy5FZOv/12skOJbq68yUWT1EZOP/3XsvPYvi58OUVD5JbOP/3HstQ5Tl58yZX0FMb+T/33wxR5ji4sqhZUZOdfL/4YIxSJPe38ejaktKbOT/4oY1UJXg5M2pcEtNcu3/6Ik1TIvV18+xfU1NY/7/7I07ToPL0c24hU9VYuz/7ZQ7S3nCy9PAmFZRXej/75lCSXK5xNPGolxPXeH/8Zs='
    );
    audioRef.current.volume = 0.3;
  }, []);

  useEffect(() => {
    const shouldNotify =
      (level === 'severe' || level === 'critical') && lastNotifiedLevel !== level;

    if (shouldNotify) {
      toast({
        variant: level === 'critical' ? 'destructive' : 'default',
        title: level === 'critical' ? '🚨 CRITICAL ALERT' : '⚠️ Severe Fatigue Warning',
        description: ALERT_MESSAGES[level],
      });
      setLastNotifiedLevel(level);

      // Play alert sound for critical
      if (level === 'critical' && soundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }

    if (level === 'alert') {
      setLastNotifiedLevel('alert');
    }
  }, [level, lastNotifiedLevel, toast, soundEnabled]);

  return (
    <motion.div layout initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 sm:space-y-4">
      {/* Main alert banner */}
      <motion.div
        key={level}
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'glass-card p-3 sm:p-4 lg:p-6 border-2 rounded-xl transition-all relative overflow-hidden',
          alertStyles[level]
        )}
      >
        {/* Background glow effect */}
        <div
          className={cn(
            'absolute inset-0 opacity-50',
            level === 'critical' && 'animate-pulse'
          )}
          style={{
            background: `radial-gradient(circle at 30% 50%, ${
              level === 'alert'
                ? 'hsl(var(--success) / 0.1)'
                : level === 'critical' || level === 'severe'
                  ? 'hsl(var(--critical) / 0.15)'
                  : 'hsl(var(--warning) / 0.1)'
            }, transparent 70%)`,
          }}
        />

        <div className="flex items-center gap-3 sm:gap-4 relative z-10">
          <motion.div
            className={cn('p-2 sm:p-3 rounded-xl', alertBgStyles[level])}
            animate={level === 'critical' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: level === 'critical' ? Infinity : 0 }}
          >
            {alertIcons[level]}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 sm:mb-1 flex-wrap">
              <h3 className="font-bold text-sm sm:text-lg uppercase tracking-wide">{level}</h3>
              <div
                className={cn(
                  'px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium',
                  alertBgStyles[level]
                )}
              >
                Level {['alert', 'drowsy', 'fatigued', 'severe', 'critical'].indexOf(level) + 1}/5
              </div>
            </div>
            <p className="text-xs sm:text-sm opacity-90 line-clamp-2">{ALERT_MESSAGES[level]}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              'p-2 rounded-lg transition-colors shrink-0',
              soundEnabled ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
            )}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
          </motion.button>
        </div>
      </motion.div>

      {/* Metric triggers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
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
    <motion.div
      className={cn(
        'px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all text-center',
        !isTriggered && 'bg-secondary/30 border-border text-muted-foreground',
        isTriggered && !isCritical && 'bg-warning/10 border-warning/30 text-warning',
        isCritical && 'bg-critical/10 border-critical/30 text-critical'
      )}
      whileHover={{ scale: 1.02 }}
    >
      <div className="text-[10px] sm:text-xs uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-mono font-bold text-sm sm:text-base">{value}</div>
    </motion.div>
  );
}
