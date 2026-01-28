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

// Optimized detection options for speed
const detectionOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224, // Smaller input = faster detection
  scoreThreshold: 0.3, // Lower threshold for faster detection
});

export function useFaceDetection(): UseFaceDetectionReturn {
  const [isLoading, setIsLoading] = useState(!faceApiLoader.loaded);
  const [isModelLoaded, setIsModelLoaded] = useState(faceApiLoader.loaded);
  const [error, setError] = useState<string | null>(faceApiLoader.error);
  const [metrics, setMetrics] = useState<FatigueMetrics>(defaultMetrics);
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('alert');
  const [history, setHistory] = useState<FatigueHistory[]>([]);

  const animationRef = useRef<number | null>(null);
  const eyeClosedFrames = useRef(0);
  const totalFrames = useRef(0);
  const blinkTimestamps = useRef<number[]>([]);
  const yawnTimestamps = useRef<number[]>([]);
  const lastEyeState = useRef(true);
  const headPoseHistory = useRef<{ pitch: number; timestamp: number }[]>([]);
  const lastHistoryUpdate = useRef(0);
  const frameSkip = useRef(0);

  // Subscribe to model loading state
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
    return (verticalA + verticalB) / (2.0 * horizontal);
  }, []);

  const calculateMouthOpenRatio = useCallback((mouth: faceapi.Point[]): number => {
    const verticalDist = Math.hypot(mouth[13].x - mouth[19].x, mouth[13].y - mouth[19].y);
    const horizontalDist = Math.hypot(mouth[0].x - mouth[6].x, mouth[0].y - mouth[6].y);
    return verticalDist / horizontalDist;
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
    const noseOffset = noseTip.x - eyeCenter.x;
    const yaw = (noseOffset / eyeWidth) * 60;

    const faceHeight = jaw[8].y - eyeCenter.y;
    const noseHeight = noseTip.y - noseBase.y;
    const pitch = ((noseHeight / faceHeight) - 0.5) * 60;

    const eyeDeltaY = rightEyeCenter.y - leftEyeCenter.y;
    const eyeDeltaX = rightEyeCenter.x - leftEyeCenter.x;
    const roll = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI);

    return { pitch, yaw, roll };
  }, []);

  const determineAlertLevel = useCallback((currentMetrics: FatigueMetrics): AlertLevel => {
    const { perclos, blinkRate, yawnFrequency, noddingDetected } = currentMetrics;

    if (perclos >= 70 || (noddingDetected && perclos >= 40)) return 'critical';
    if (perclos >= 50 || yawnFrequency >= 5) return 'severe';
    if (perclos >= 35 || yawnFrequency >= 3) return 'fatigued';
    if (perclos >= 25 || blinkRate < 8 || blinkRate > 25) return 'drowsy';
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

  const drawLandmarks = useCallback((ctx: CanvasRenderingContext2D, landmarks: faceapi.FaceLandmarks68) => {
    ctx.strokeStyle = 'hsl(187, 92%, 50%)';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'hsl(187, 92%, 50%)';
    ctx.shadowBlur = 8;

    // Draw face outline
    const jaw = landmarks.getJawOutline();
    ctx.beginPath();
    jaw.forEach((point, i) => {
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw eyes with glow
    [landmarks.getLeftEye(), landmarks.getRightEye()].forEach((eye) => {
      ctx.beginPath();
      eye.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
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

      // Skip every other frame for performance (process at ~15fps instead of 30fps)
      frameSkip.current++;
      if (frameSkip.current % 2 !== 0) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const detections = await faceapi
          .detectSingleFace(video, detectionOptions)
          .withFaceLandmarks()
          .withFaceExpressions();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections) {
          const landmarks = detections.landmarks;
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const mouth = landmarks.getMouth();

          // Draw landmarks
          drawLandmarks(ctx, landmarks);

          // Calculate metrics
          const leftEAR = calculateEAR(leftEye);
          const rightEAR = calculateEAR(rightEye);
          const avgEAR = (leftEAR + rightEAR) / 2;
          const eyesOpen = avgEAR > 0.2;

          const mouthOpenRatio = calculateMouthOpenRatio(mouth);
          const isYawning = mouthOpenRatio > 0.5;

          const headPose = calculateHeadPose(landmarks);

          // Track PERCLOS
          totalFrames.current++;
          if (!eyesOpen) {
            eyeClosedFrames.current++;
          }
          const perclos = (eyeClosedFrames.current / totalFrames.current) * 100;

          // Track blinks
          const now = Date.now();
          if (lastEyeState.current && !eyesOpen) {
            blinkTimestamps.current.push(now);
            blinkTimestamps.current = blinkTimestamps.current.filter((t) => now - t < 60000);
          }
          lastEyeState.current = eyesOpen;
          const blinkRate = blinkTimestamps.current.length;

          // Track yawns
          if (isYawning) {
            const lastYawn = yawnTimestamps.current[yawnTimestamps.current.length - 1];
            if (!lastYawn || now - lastYawn > 5000) {
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
            noddingDetected = maxPitch - minPitch > 15;
          }

          const newMetrics: FatigueMetrics = {
            perclos: Math.round(perclos * 10) / 10,
            blinkRate,
            blinkPattern: determineBlinkPattern(blinkRate, blinkTimestamps.current),
            yawnCount: yawnTimestamps.current.length,
            yawnFrequency,
            mouthOpenRatio: Math.round(mouthOpenRatio * 100) / 100,
            headPose: {
              pitch: Math.round(headPose.pitch),
              yaw: Math.round(headPose.yaw),
              roll: Math.round(headPose.roll),
            },
            noddingDetected,
            eyesOpen,
            faceDetected: true,
          };

          setMetrics(newMetrics);
          setAlertLevel(determineAlertLevel(newMetrics));

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
    frameSkip.current = 0;
  }, []);

  return {
    isLoading,
    isModelLoaded,
    error,
    metrics,
    alertLevel,
    history,
    startDetection,
    stopDetection,
  };
}
