import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Activity, Frown, RotateCcw, Gauge } from 'lucide-react';
import type { FatigueMetrics } from '@/types/fatigue';
import { cn } from '@/lib/utils';

interface VisionIndicatorsProps {
  metrics: FatigueMetrics;
}

export function VisionIndicators({ metrics }: VisionIndicatorsProps) {
  return (
    <div className="space-y-4">
      {/* Eye Tracking Visualization */}
      <EyeTrackingDisplay 
        eyesOpen={metrics.eyesOpen} 
        perclos={metrics.perclos}
        blinkRate={metrics.blinkRate}
        blinkPattern={metrics.blinkPattern}
      />
      
      {/* Detailed Blink Analysis */}
      <BlinkAnalysisPanel 
        blinkRate={metrics.blinkRate}
        blinkPattern={metrics.blinkPattern}
        eyesOpen={metrics.eyesOpen}
      />
      
      {/* Yawn & Mouth Analysis */}
      <YawnAnalysisPanel 
        yawnCount={metrics.yawnCount}
        yawnFrequency={metrics.yawnFrequency}
        mouthOpenRatio={metrics.mouthOpenRatio}
      />
      
      {/* Head Pose Analysis */}
      <HeadPoseAnalysisPanel 
        headPose={metrics.headPose}
        noddingDetected={metrics.noddingDetected}
      />
    </div>
  );
}

// Animated Eye Display Component
interface EyeTrackingDisplayProps {
  eyesOpen: boolean;
  perclos: number;
  blinkRate: number;
  blinkPattern: string;
}

function EyeTrackingDisplay({ eyesOpen, perclos, blinkRate, blinkPattern }: EyeTrackingDisplayProps) {
  const eyeOpenness = eyesOpen ? 1 : 0.1;
  const irisColor = perclos > 50 ? 'bg-critical' : perclos > 25 ? 'bg-warning' : 'bg-primary';
  
  return (
    <motion.div 
      className="glass-card p-4 sm:p-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" />
          Eye Tracking
        </h3>
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          eyesOpen ? "bg-success/20 text-success" : "bg-critical/20 text-critical"
        )}>
          {eyesOpen ? "Eyes Open" : "Eyes Closed"}
        </div>
      </div>
      
      {/* Animated Eyes */}
      <div className="flex justify-center gap-6 sm:gap-10 mb-4">
        <AnimatedEye isOpen={eyesOpen} perclos={perclos} side="left" />
        <AnimatedEye isOpen={eyesOpen} perclos={perclos} side="right" />
      </div>
      
      {/* Eye Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4">
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">PERCLOS</p>
          <p className={cn(
            "text-lg sm:text-xl font-bold font-mono",
            perclos > 50 ? "text-critical" : perclos > 25 ? "text-warning" : "text-success"
          )}>
            {perclos.toFixed(1)}%
          </p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">Blink Rate</p>
          <p className="text-lg sm:text-xl font-bold font-mono text-primary">
            {blinkRate}/min
          </p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase">Pattern</p>
          <p className={cn(
            "text-sm sm:text-base font-semibold capitalize",
            blinkPattern === 'normal' ? "text-success" : 
            blinkPattern === 'slow' ? "text-warning" : "text-critical"
          )}>
            {blinkPattern}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Individual Animated Eye
interface AnimatedEyeProps {
  isOpen: boolean;
  perclos: number;
  side: 'left' | 'right';
}

function AnimatedEye({ isOpen, perclos, side }: AnimatedEyeProps) {
  const openness = isOpen ? 1 : 0.15;
  const irisColor = perclos > 50 ? 'bg-critical' : perclos > 25 ? 'bg-warning' : 'bg-cyan-400';
  
  return (
    <motion.div 
      className="relative"
      animate={{ scale: isOpen ? 1 : 0.95 }}
      transition={{ duration: 0.15 }}
    >
      {/* Eye socket/background */}
      <div className="w-16 h-10 sm:w-20 sm:h-12 bg-white/90 rounded-[50%] relative overflow-hidden border-2 border-foreground/20 shadow-lg">
        {/* Eyelid animation */}
        <motion.div 
          className="absolute inset-0 bg-foreground/80 origin-top"
          animate={{ 
            scaleY: 1 - openness,
            y: 0
          }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          style={{ transformOrigin: 'top' }}
        />
        
        {/* Iris */}
        <motion.div 
          className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full",
            irisColor
          )}
          animate={{ 
            opacity: isOpen ? 1 : 0.3,
            scale: isOpen ? 1 : 0.8
          }}
          transition={{ duration: 0.1 }}
        >
          {/* Pupil */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 bg-foreground rounded-full">
            {/* Light reflection */}
            <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-80" />
          </div>
        </motion.div>
        
        {/* Blink flash effect */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div 
              className="absolute inset-0 bg-foreground/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.05 }}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Eye label */}
      <p className="text-[10px] text-muted-foreground text-center mt-1 uppercase">
        {side}
      </p>
    </motion.div>
  );
}

// Blink Analysis Panel
interface BlinkAnalysisPanelProps {
  blinkRate: number;
  blinkPattern: string;
  eyesOpen: boolean;
}

function BlinkAnalysisPanel({ blinkRate, blinkPattern, eyesOpen }: BlinkAnalysisPanelProps) {
  const getBlinkStatus = () => {
    if (blinkRate < 5) return { status: 'critical', label: 'Very Low', message: 'Dangerously low blink rate' };
    if (blinkRate < 8) return { status: 'warning', label: 'Low', message: 'Below normal range' };
    if (blinkRate > 25) return { status: 'warning', label: 'High', message: 'Above normal range' };
    if (blinkRate > 30) return { status: 'critical', label: 'Very High', message: 'Abnormally high rate' };
    return { status: 'normal', label: 'Normal', message: '10-20 blinks per minute' };
  };
  
  const blinkStatus = getBlinkStatus();
  const normalizedRate = Math.min(blinkRate / 30, 1) * 100;
  
  return (
    <motion.div 
      className="glass-card p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Blink Analysis
        </h3>
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full font-medium",
          blinkStatus.status === 'normal' && "bg-success/20 text-success",
          blinkStatus.status === 'warning' && "bg-warning/20 text-warning",
          blinkStatus.status === 'critical' && "bg-critical/20 text-critical"
        )}>
          {blinkStatus.label}
        </span>
      </div>
      
      {/* Blink Rate Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>0</span>
          <span className="font-medium text-foreground">{blinkRate} blinks/min</span>
          <span>30+</span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div 
            className={cn(
              "h-full rounded-full",
              blinkStatus.status === 'normal' && "bg-gradient-to-r from-success to-success/70",
              blinkStatus.status === 'warning' && "bg-gradient-to-r from-warning to-warning/70",
              blinkStatus.status === 'critical' && "bg-gradient-to-r from-critical to-critical/70"
            )}
            initial={{ width: 0 }}
            animate={{ width: `${normalizedRate}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {/* Normal range indicator */}
        <div className="relative h-1 mt-1">
          <div 
            className="absolute h-full bg-success/30 rounded"
            style={{ left: '33%', width: '33%' }}
          />
          <span className="absolute text-[8px] text-success" style={{ left: '33%' }}>10</span>
          <span className="absolute text-[8px] text-success" style={{ left: '66%' }}>20</span>
        </div>
      </div>
      
      {/* Pattern & Status */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="p-2 bg-secondary/50 rounded-lg">
          <p className="text-[10px] text-muted-foreground uppercase">Pattern Type</p>
          <p className={cn(
            "text-sm font-semibold capitalize",
            blinkPattern === 'normal' ? "text-success" : 
            blinkPattern === 'slow' ? "text-warning" : 
            blinkPattern === 'rapid' ? "text-warning" : "text-critical"
          )}>
            {blinkPattern}
          </p>
        </div>
        <div className="p-2 bg-secondary/50 rounded-lg">
          <p className="text-[10px] text-muted-foreground uppercase">Current State</p>
          <div className="flex items-center gap-1">
            {eyesOpen ? (
              <Eye className="w-4 h-4 text-success" />
            ) : (
              <EyeOff className="w-4 h-4 text-warning" />
            )}
            <span className={cn(
              "text-sm font-semibold",
              eyesOpen ? "text-success" : "text-warning"
            )}>
              {eyesOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Yawn Analysis Panel
interface YawnAnalysisPanelProps {
  yawnCount: number;
  yawnFrequency: number;
  mouthOpenRatio: number;
}

function YawnAnalysisPanel({ yawnCount, yawnFrequency, mouthOpenRatio }: YawnAnalysisPanelProps) {
  const isYawning = mouthOpenRatio > 0.5;
  const mouthPercentage = Math.min(mouthOpenRatio * 100, 100);
  
  return (
    <motion.div 
      className="glass-card p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Frown className="w-4 h-4 text-warning" />
          Yawn Detection
        </h3>
        <AnimatePresence>
          {isYawning && (
            <motion.span 
              className="text-xs px-2 py-0.5 rounded-full font-medium bg-warning/20 text-warning"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              Yawning!
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      {/* Mouth Visualization */}
      <div className="flex items-center justify-center mb-4">
        <motion.div 
          className="relative w-20 h-12 sm:w-24 sm:h-14"
          animate={{ scale: isYawning ? 1.05 : 1 }}
        >
          {/* Lips outline */}
          <svg viewBox="0 0 100 60" className="w-full h-full">
            {/* Upper lip */}
            <motion.path
              d="M10 30 Q30 15 50 20 Q70 15 90 30"
              fill="none"
              stroke="hsl(var(--critical))"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Lower lip */}
            <motion.path
              d={`M10 30 Q30 ${30 + mouthPercentage * 0.3} 50 ${30 + mouthPercentage * 0.4} Q70 ${30 + mouthPercentage * 0.3} 90 30`}
              fill="none"
              stroke="hsl(var(--critical))"
              strokeWidth="4"
              strokeLinecap="round"
              animate={{ 
                d: `M10 30 Q30 ${30 + mouthPercentage * 0.3} 50 ${30 + mouthPercentage * 0.4} Q70 ${30 + mouthPercentage * 0.3} 90 30`
              }}
            />
            {/* Mouth opening fill */}
            <motion.ellipse
              cx="50"
              cy={30 + mouthPercentage * 0.15}
              rx="30"
              ry={mouthPercentage * 0.15}
              fill="hsl(var(--foreground) / 0.3)"
              animate={{
                ry: mouthPercentage * 0.15,
                cy: 30 + mouthPercentage * 0.15
              }}
            />
          </svg>
        </motion.div>
      </div>
      
      {/* Yawn Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <p className="text-[10px] text-muted-foreground uppercase">Total Yawns</p>
          <p className={cn(
            "text-lg font-bold font-mono",
            yawnCount >= 5 ? "text-critical" : yawnCount >= 3 ? "text-warning" : "text-foreground"
          )}>
            {yawnCount}
          </p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <p className="text-[10px] text-muted-foreground uppercase">Frequency</p>
          <p className={cn(
            "text-lg font-bold font-mono",
            yawnFrequency >= 5 ? "text-critical" : yawnFrequency >= 3 ? "text-warning" : "text-foreground"
          )}>
            {yawnFrequency}/min
          </p>
        </div>
        <div className="text-center p-2 bg-secondary/50 rounded-lg">
          <p className="text-[10px] text-muted-foreground uppercase">Mouth Open</p>
          <p className={cn(
            "text-lg font-bold font-mono",
            mouthOpenRatio > 0.5 ? "text-warning" : "text-foreground"
          )}>
            {mouthPercentage.toFixed(0)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Head Pose Analysis Panel
interface HeadPoseAnalysisPanelProps {
  headPose: { pitch: number; yaw: number; roll: number };
  noddingDetected: boolean;
}

function HeadPoseAnalysisPanel({ headPose, noddingDetected }: HeadPoseAnalysisPanelProps) {
  const isLookingDown = headPose.pitch > 15;
  const isLookingAway = Math.abs(headPose.yaw) > 30;
  const isTilted = Math.abs(headPose.roll) > 15;
  
  return (
    <motion.div 
      className="glass-card p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-primary" />
          Head Pose Analysis
        </h3>
        <AnimatePresence>
          {noddingDetected && (
            <motion.span 
              className="text-xs px-2 py-0.5 rounded-full font-medium bg-critical/20 text-critical animate-pulse"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              ⚠️ Nodding Detected!
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      {/* Head Position Indicators */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <PoseIndicator 
          label="Pitch (Up/Down)" 
          value={headPose.pitch} 
          warning={isLookingDown}
          color="critical"
        />
        <PoseIndicator 
          label="Yaw (Left/Right)" 
          value={headPose.yaw} 
          warning={isLookingAway}
          color="success"
        />
        <PoseIndicator 
          label="Roll (Tilt)" 
          value={headPose.roll} 
          warning={isTilted}
          color="primary"
        />
      </div>
      
      {/* Status Alerts */}
      <div className="flex flex-wrap gap-2 mt-3">
        {isLookingDown && (
          <span className="text-[10px] px-2 py-1 rounded bg-warning/20 text-warning">
            Looking Down
          </span>
        )}
        {isLookingAway && (
          <span className="text-[10px] px-2 py-1 rounded bg-warning/20 text-warning">
            Looking Away
          </span>
        )}
        {isTilted && (
          <span className="text-[10px] px-2 py-1 rounded bg-warning/20 text-warning">
            Head Tilted
          </span>
        )}
        {!isLookingDown && !isLookingAway && !isTilted && !noddingDetected && (
          <span className="text-[10px] px-2 py-1 rounded bg-success/20 text-success">
            ✓ Normal Position
          </span>
        )}
      </div>
    </motion.div>
  );
}

// Pose Indicator Component
interface PoseIndicatorProps {
  label: string;
  value: number;
  warning: boolean;
  color: 'critical' | 'success' | 'primary';
}

function PoseIndicator({ label, value, warning, color }: PoseIndicatorProps) {
  const normalized = (value + 90) / 180 * 100; // -90 to 90 -> 0 to 100
  
  const colorClasses = {
    critical: 'bg-critical',
    success: 'bg-success',
    primary: 'bg-primary'
  };
  
  return (
    <div className="text-center">
      <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-1 truncate">{label}</p>
      <p className={cn(
        "text-base sm:text-lg font-bold font-mono",
        warning ? "text-warning" : "text-foreground"
      )}>
        {value > 0 ? '+' : ''}{value}°
      </p>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mt-1 relative">
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground/30 -translate-x-1/2" />
        {/* Value indicator */}
        <motion.div 
          className={cn("absolute top-0 bottom-0 w-2 rounded-full", colorClasses[color])}
          animate={{ left: `calc(${normalized}% - 4px)` }}
          transition={{ duration: 0.2 }}
        />
      </div>
    </div>
  );
}
