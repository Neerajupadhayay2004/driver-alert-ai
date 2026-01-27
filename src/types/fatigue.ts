export type AlertLevel = 'alert' | 'drowsy' | 'fatigued' | 'severe' | 'critical';

export interface FatigueMetrics {
  perclos: number; // 0-100%
  blinkRate: number; // blinks per minute
  blinkPattern: 'normal' | 'irregular' | 'slow' | 'rapid';
  yawnCount: number;
  yawnFrequency: number; // yawns per minute
  mouthOpenRatio: number; // 0-1
  headPose: {
    pitch: number; // -90 to 90
    yaw: number; // -90 to 90
    roll: number; // -90 to 90
  };
  noddingDetected: boolean;
  eyesOpen: boolean;
  faceDetected: boolean;
}

export interface AlertState {
  level: AlertLevel;
  message: string;
  timestamp: Date;
  metrics: Partial<FatigueMetrics>;
}

export interface FatigueHistory {
  timestamp: Date;
  perclos: number;
  alertLevel: AlertLevel;
  blinkRate: number;
  yawnCount: number;
}

export const ALERT_THRESHOLDS = {
  perclos: {
    alert: 15,
    drowsy: 25,
    fatigued: 35,
    severe: 50,
    critical: 70,
  },
  blinkRate: {
    low: 8,
    normal: { min: 10, max: 20 },
    high: 25,
  },
  yawnFrequency: {
    warning: 3,
    severe: 5,
  },
  headNodAngle: 15,
} as const;

export const ALERT_COLORS: Record<AlertLevel, string> = {
  alert: 'hsl(var(--success))',
  drowsy: 'hsl(var(--warning))',
  fatigued: 'hsl(38 92% 50%)',
  severe: 'hsl(var(--critical))',
  critical: 'hsl(0 84% 45%)',
};

export const ALERT_MESSAGES: Record<AlertLevel, string> = {
  alert: 'Driver is alert and attentive',
  drowsy: 'Early signs of drowsiness detected',
  fatigued: 'Fatigue indicators present - Consider a break',
  severe: 'Severe fatigue detected - Pull over soon',
  critical: 'CRITICAL: Immediate rest required!',
};
