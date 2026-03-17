import { useState, useEffect, useRef, useCallback } from 'react';
import { faceApiLoader, faceapi } from '@/lib/faceApiLoader';
import type { FatigueMetrics, AlertLevel } from '@/types/fatigue';

interface UseFaceDetectionReturn {
  isLoading: boolean;
  isModelLoaded: boolean;
  error: string | null;
  metrics: FatigueMetrics;
  alertLevel: AlertLevel;
  history: FatigueHistory[];
  confidence: number;
  startDetection: (video: HTMLVideoElement, canvas: HTMLCanvasElement) => void;
  stopDetection: () => void;
}

interface FatigueHistory {
  timestamp: Date;
  perclos: number;
  alertLevel: AlertLevel;
  blinkRate: number;
  yawnCount: number;
}

const defaultMetrics: FatigueMetrics = {
  perclos: 0,
  blinkRate: 15,
  blinkPattern: 'normal',
  yawnCount: 0,
  yawnFrequency: 0,
  mouthOpenRatio: 0,
  headPose: { pitch: 0, yaw: 0, roll: 0 },
  noddingDetected: false,
  eyesOpen: true,
  faceDetected: false,
};

// Improved detection: higher input for accuracy, balanced threshold
const detectionOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224, // Better accuracy than 160
  scoreThreshold: 0.3,
});

// Exponential moving average for smoothing
class EMAFilter {
  private value: number;
  private alpha: number;
  private initialized = false;

  constructor(alpha = 0.3) {
    this.alpha = alpha;
    this.value = 0;
  }

  update(raw: number): number {
    if (!this.initialized) {
      this.value = raw;
      this.initialized = true;
      return raw;
    }
    this.value = this.alpha * raw + (1 - this.alpha) * this.value;
    return this.value;
  }

  get current() { return this.value; }
  reset() { this.initialized = false; this.value = 0; }
}

// Adaptive EAR threshold with calibration
class EARCalibrator {
  private samples: number[] = [];
  private calibrated = false;
  private openThreshold = 0.22;
  private closedThreshold = 0.18;
  private readonly CALIBRATION_FRAMES = 30;

  addSample(ear: number) {
    if (this.calibrated) return;
    this.samples.push(ear);
    if (this.samples.length >= this.CALIBRATION_FRAMES) {
      this.calibrate();
    }
  }

  private calibrate() {
    const sorted = [...this.samples].sort((a, b) => a - b);
    // Top 70% are "open" frames (assuming user starts with eyes open)
    const openSamples = sorted.slice(Math.floor(sorted.length * 0.3));
    const avgOpen = openSamples.reduce((a, b) => a + b, 0) / openSamples.length;
    
    this.openThreshold = avgOpen * 0.75; // 75% of average open EAR
    this.closedThreshold = avgOpen * 0.6; // 60% of average open EAR
    this.calibrated = true;
    console.log(`[EAR] Calibrated: open=${this.openThreshold.toFixed(3)}, closed=${this.closedThreshold.toFixed(3)}`);
  }

  isEyeOpen(ear: number): boolean {
    return ear > this.openThreshold;
  }

  isEyeClosed(ear: number): boolean {
    return ear < this.closedThreshold;
  }

  get isCalibrated() { return this.calibrated; }
  
  reset() {
    this.samples = [];
    this.calibrated = false;
    this.openThreshold = 0.22;
    this.closedThreshold = 0.18;
  }
}

export function useFaceDetection(): UseFaceDetectionReturn {
  const [isLoading, setIsLoading] = useState(!faceApiLoader.loaded);
  const [isModelLoaded, setIsModelLoaded] = useState(faceApiLoader.loaded);
  const [error, setError] = useState<string | null>(faceApiLoader.error);
  const [metrics, setMetrics] = useState<FatigueMetrics>(defaultMetrics);
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('alert');
  const [history, setHistory] = useState<FatigueHistory[]>([]);
  const [confidence, setConfidence] = useState(0);

  const animationRef = useRef<number | null>(null);
  const eyeClosedFrames = useRef(0);
  const totalFrames = useRef(0);
  const blinkTimestamps = useRef<number[]>([]);
  const yawnTimestamps = useRef<number[]>([]);
  const lastEyeState = useRef(true);
  const headPoseHistory = useRef<{ pitch: number; timestamp: number }[]>([]);
  const lastHistoryUpdate = useRef(0);
  
  // Smoothing filters
  const earFilter = useRef(new EMAFilter(0.4));
  const pitchFilter = useRef(new EMAFilter(0.3));
  const yawFilter = useRef(new EMAFilter(0.3));
  const rollFilter = useRef(new EMAFilter(0.3));
  const mouthFilter = useRef(new EMAFilter(0.35));
  
  // Adaptive calibration
  const earCalibrator = useRef(new EARCalibrator());
  
  // Consecutive frame tracking for blink debouncing
  const consecutiveClosedFrames = useRef(0);
  const consecutiveOpenFrames = useRef(0);
  const BLINK_MIN_CLOSED_FRAMES = 2; // Min frames for a blink
  const BLINK_MAX_CLOSED_FRAMES = 15; // Max frames (longer = sleeping)
  
  // PERCLOS sliding window (last 30 seconds)
  const perclosWindow = useRef<{ closed: boolean; timestamp: number }[]>([]);

  useEffect(() => {
    const unsubscribe = faceApiLoader.subscribe((loaded, loadError) => {
      setIsModelLoaded(loaded);
      setIsLoading(!loaded && !loadError);
      setError(loadError ?? null);
    });
    return unsubscribe;
  }, []);

  const calculateEAR = useCallback((eye: faceapi.Point[]): number => {
    const verticalA = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
    const verticalB = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
    const horizontal = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
    if (horizontal === 0) return 0;
    return (verticalA + verticalB) / (2.0 * horizontal);
  }, []);

  const calculateMouthOpenRatio = useCallback((mouth: faceapi.Point[]): number => {
    // Use multiple vertical measurements for accuracy
    const v1 = Math.hypot(mouth[13].x - mouth[19].x, mouth[13].y - mouth[19].y);
    const v2 = Math.hypot(mouth[14].x - mouth[18].x, mouth[14].y - mouth[18].y);
    const horizontalDist = Math.hypot(mouth[0].x - mouth[6].x, mouth[0].y - mouth[6].y);
    if (horizontalDist === 0) return 0;
    return (v1 + v2) / (2 * horizontalDist);
  }, []);

  const calculateHeadPose = useCallback((landmarks: faceapi.FaceLandmarks68) => {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jaw = landmarks.getJawOutline();

    const eyeCenter = {
      x: (leftEye[0].x + rightEye[3].x) / 2,
      y: (leftEye[0].y + rightEye[3].y) / 2,
    };

    const noseTip = nose[6];
    const noseBase = nose[0];

    const leftEyeCenter = { x: (leftEye[0].x + leftEye[3].x) / 2, y: (leftEye[0].y + leftEye[3].y) / 2 };
    const rightEyeCenter = { x: (rightEye[0].x + rightEye[3].x) / 2, y: (rightEye[0].y + rightEye[3].y) / 2 };
    const eyeWidth = rightEyeCenter.x - leftEyeCenter.x;
    if (eyeWidth === 0) return { pitch: 0, yaw: 0, roll: 0 };
    
    const noseOffset = noseTip.x - eyeCenter.x;
    const yaw = (noseOffset / eyeWidth) * 60;

    const faceHeight = jaw[8].y - eyeCenter.y;
    if (faceHeight === 0) return { pitch: 0, yaw: 0, roll: 0 };
    const noseHeight = noseTip.y - noseBase.y;
    const pitch = ((noseHeight / faceHeight) - 0.5) * 60;

    const eyeDeltaY = rightEyeCenter.y - leftEyeCenter.y;
    const eyeDeltaX = rightEyeCenter.x - leftEyeCenter.x;
    const roll = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI);

    return {
      pitch: pitchFilter.current.update(pitch),
      yaw: yawFilter.current.update(yaw),
      roll: rollFilter.current.update(roll),
    };
  }, []);

  const determineAlertLevel = useCallback((currentMetrics: FatigueMetrics): AlertLevel => {
    const { perclos, blinkRate, yawnFrequency, noddingDetected } = currentMetrics;
    
    // Weighted scoring system for more accurate alerting
    let score = 0;
    
    if (perclos >= 70) score += 5;
    else if (perclos >= 50) score += 4;
    else if (perclos >= 35) score += 3;
    else if (perclos >= 25) score += 2;
    else if (perclos >= 15) score += 1;
    
    if (blinkRate < 5) score += 3;
    else if (blinkRate < 8 || blinkRate > 30) score += 2;
    else if (blinkRate > 25) score += 1;
    
    if (yawnFrequency >= 5) score += 3;
    else if (yawnFrequency >= 3) score += 2;
    else if (yawnFrequency >= 1) score += 1;
    
    if (noddingDetected) score += 3;
    
    if (score >= 8) return 'critical';
    if (score >= 6) return 'severe';
    if (score >= 4) return 'fatigued';
    if (score >= 2) return 'drowsy';
    return 'alert';
  }, []);

  const determineBlinkPattern = useCallback((rate: number, timestamps: number[]): FatigueMetrics['blinkPattern'] => {
    if (timestamps.length < 5) return 'normal';

    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;

    if (variance > 50000) return 'irregular';
    if (rate < 8) return 'slow';
    if (rate > 25) return 'rapid';
    return 'normal';
  }, []);

  const drawLandmarks = useCallback((ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68, detectionScore: number) => {
    const hue = detectionScore > 0.7 ? 187 : detectionScore > 0.4 ? 38 : 0;
    ctx.strokeStyle = `hsl(${hue}, 92%, 50%)`;
    ctx.lineWidth = 2;
    ctx.shadowColor = `hsl(${hue}, 92%, 50%)`;
    ctx.shadowBlur = 10;

    // Draw face outline
    const jaw = landmarks.getJawOutline();
    ctx.beginPath();
    jaw.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw eyes
    [landmarks.getLeftEye(), landmarks.getRightEye()].forEach((eye) => {
      ctx.beginPath();
      eye.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
    });

    // Draw nose
    ctx.strokeStyle = `hsl(${hue}, 60%, 40%)`;
    ctx.lineWidth = 1;
    const nose = landmarks.getNose();
    ctx.beginPath();
    nose.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw mouth
    ctx.strokeStyle = `hsl(${hue}, 80%, 45%)`;
    const mouth = landmarks.getMouth();
    ctx.beginPath();
    mouth.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();

    // Draw eyebrows
    ctx.strokeStyle = `hsl(${hue}, 50%, 35%)`;
    [landmarks.getLeftEyeBrow(), landmarks.getRightEyeBrow()].forEach((brow) => {
      ctx.beginPath();
      brow.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });

    ctx.shadowBlur = 0;
  }, []);

  const startDetection = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (!isModelLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const detect = async () => {
      if (video.paused || video.ended) return;

      try {
        const detections = await faceapi
          .detectSingleFace(video, detectionOptions)
          .withFaceLandmarks()
          .withFaceExpressions();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections) {
          const landmarks = detections.landmarks;
          const detectionScore = detections.detection.score;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const mouth = landmarks.getMouth();

          // Draw all landmarks with confidence-based coloring
          drawLandmarks(ctx, landmarks, detectionScore);

          // Calculate EAR with smoothing
          const leftEAR = calculateEAR(leftEye);
          const rightEAR = calculateEAR(rightEye);
          const rawEAR = (leftEAR + rightEAR) / 2;
          const smoothedEAR = earFilter.current.update(rawEAR);
          
          // Feed calibrator
          earCalibrator.current.addSample(rawEAR);
          
          // Use adaptive threshold if calibrated, else default
          const eyesOpen = earCalibrator.current.isCalibrated 
            ? earCalibrator.current.isEyeOpen(smoothedEAR)
            : smoothedEAR > 0.2;

          // Blink debouncing - require consecutive frames
          if (!eyesOpen) {
            consecutiveClosedFrames.current++;
            consecutiveOpenFrames.current = 0;
          } else {
            consecutiveOpenFrames.current++;
            consecutiveClosedFrames.current = 0;
          }

          // Only count as "closed" if consistently closed
          const isReallyClosed = consecutiveClosedFrames.current >= BLINK_MIN_CLOSED_FRAMES;
          const isReallyOpen = consecutiveOpenFrames.current >= 2;
          const effectiveEyeState = isReallyClosed ? false : isReallyOpen ? true : lastEyeState.current;

          // Mouth with smoothing
          const rawMouthRatio = calculateMouthOpenRatio(mouth);
          const smoothedMouthRatio = mouthFilter.current.update(rawMouthRatio);
          const isYawning = smoothedMouthRatio > 0.45;

          // Head pose (already smoothed in calculateHeadPose)
          const headPose = calculateHeadPose(landmarks);

          // PERCLOS with sliding window (30 seconds)
          const now = Date.now();
          perclosWindow.current.push({ closed: !effectiveEyeState, timestamp: now });
          perclosWindow.current = perclosWindow.current.filter(p => now - p.timestamp < 30000);
          
          const closedCount = perclosWindow.current.filter(p => p.closed).length;
          const perclos = perclosWindow.current.length > 0 
            ? (closedCount / perclosWindow.current.length) * 100 
            : 0;

          // Track PERCLOS legacy for total session
          totalFrames.current++;
          if (!effectiveEyeState) eyeClosedFrames.current++;

          // Track blinks with debouncing
          if (lastEyeState.current && !effectiveEyeState && 
              consecutiveClosedFrames.current === BLINK_MIN_CLOSED_FRAMES) {
            blinkTimestamps.current.push(now);
            blinkTimestamps.current = blinkTimestamps.current.filter((t) => now - t < 60000);
          }
          lastEyeState.current = effectiveEyeState;
          const blinkRate = blinkTimestamps.current.length;

          // Track yawns with better debouncing
          if (isYawning) {
            const lastYawn = yawnTimestamps.current[yawnTimestamps.current.length - 1];
            if (!lastYawn || now - lastYawn > 4000) {
              yawnTimestamps.current.push(now);
            }
          }
          yawnTimestamps.current = yawnTimestamps.current.filter((t) => now - t < 60000);
          const yawnFrequency = yawnTimestamps.current.length;

          // Track head nodding
          headPoseHistory.current.push({ pitch: headPose.pitch, timestamp: now });
          headPoseHistory.current = headPoseHistory.current.filter((h) => now - h.timestamp < 3000);

          let noddingDetected = false;
          if (headPoseHistory.current.length > 10) {
            const pitches = headPoseHistory.current.map((h) => h.pitch);
            const maxPitch = Math.max(...pitches);
            const minPitch = Math.min(...pitches);
            noddingDetected = maxPitch - minPitch > 12;
          }

          const newMetrics: FatigueMetrics = {
            perclos: Math.round(perclos * 10) / 10,
            blinkRate,
            blinkPattern: determineBlinkPattern(blinkRate, blinkTimestamps.current),
            yawnCount: yawnTimestamps.current.length,
            yawnFrequency,
            mouthOpenRatio: Math.round(smoothedMouthRatio * 100) / 100,
            headPose: {
              pitch: Math.round(headPose.pitch),
              yaw: Math.round(headPose.yaw),
              roll: Math.round(headPose.roll),
            },
            noddingDetected,
            eyesOpen: effectiveEyeState,
            faceDetected: true,
          };

          setMetrics(newMetrics);
          setAlertLevel(determineAlertLevel(newMetrics));
          setConfidence(Math.round(detectionScore * 100));

          // Add to history every 5 seconds
          if (now - lastHistoryUpdate.current > 5000) {
            lastHistoryUpdate.current = now;
            setHistory((prev) =>
              [...prev.slice(-60), {
                timestamp: new Date(),
                perclos: newMetrics.perclos,
                alertLevel: determineAlertLevel(newMetrics),
                blinkRate: newMetrics.blinkRate,
                yawnCount: newMetrics.yawnCount,
              }]
            );
          }
        } else {
          setMetrics((prev) => ({ ...prev, faceDetected: false }));
          setConfidence(0);
        }
      } catch (err) {
        console.error('Detection error:', err);
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [isModelLoaded, calculateEAR, calculateMouthOpenRatio, calculateHeadPose, determineAlertLevel, determineBlinkPattern, drawLandmarks]);

  const stopDetection = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    eyeClosedFrames.current = 0;
    totalFrames.current = 0;
    blinkTimestamps.current = [];
    yawnTimestamps.current = [];
    headPoseHistory.current = [];
    perclosWindow.current = [];
    consecutiveClosedFrames.current = 0;
    consecutiveOpenFrames.current = 0;
    earFilter.current.reset();
    pitchFilter.current.reset();
    yawFilter.current.reset();
    rollFilter.current.reset();
    mouthFilter.current.reset();
    earCalibrator.current.reset();
  }, []);

  return {
    isLoading,
    isModelLoaded,
    error,
    metrics,
    alertLevel,
    history,
    confidence,
    startDetection,
    stopDetection,
  };
}
