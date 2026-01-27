import { useState, useEffect, useRef, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import type { FatigueMetrics, AlertLevel, FatigueHistory, ALERT_THRESHOLDS } from '@/types/fatigue';

const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

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

export function useFaceDetection(): UseFaceDetectionReturn {
  const [isLoading, setIsLoading] = useState(true);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
        ]);
        setIsModelLoaded(true);
        setError(null);
      } catch (err) {
        console.error('Error loading face-api models:', err);
        setError('Failed to load face detection models');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  const calculateEAR = (eye: faceapi.Point[]): number => {
    // Eye Aspect Ratio calculation
    const verticalA = Math.sqrt(
      Math.pow(eye[1].x - eye[5].x, 2) + Math.pow(eye[1].y - eye[5].y, 2)
    );
    const verticalB = Math.sqrt(
      Math.pow(eye[2].x - eye[4].x, 2) + Math.pow(eye[2].y - eye[4].y, 2)
    );
    const horizontal = Math.sqrt(
      Math.pow(eye[0].x - eye[3].x, 2) + Math.pow(eye[0].y - eye[3].y, 2)
    );
    return (verticalA + verticalB) / (2.0 * horizontal);
  };

  const calculateMouthOpenRatio = (mouth: faceapi.Point[]): number => {
    const verticalDist = Math.sqrt(
      Math.pow(mouth[13].x - mouth[19].x, 2) + Math.pow(mouth[13].y - mouth[19].y, 2)
    );
    const horizontalDist = Math.sqrt(
      Math.pow(mouth[0].x - mouth[6].x, 2) + Math.pow(mouth[0].y - mouth[6].y, 2)
    );
    return verticalDist / horizontalDist;
  };

  const calculateHeadPose = (landmarks: faceapi.FaceLandmarks68): { pitch: number; yaw: number; roll: number } => {
    const nose = landmarks.getNose();
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const jaw = landmarks.getJawOutline();

    // Simplified head pose estimation
    const eyeCenter = {
      x: (leftEye[0].x + rightEye[3].x) / 2,
      y: (leftEye[0].y + rightEye[3].y) / 2,
    };
    
    const noseTip = nose[6];
    const noseBase = nose[0];

    // Yaw (left-right rotation)
    const leftEyeCenter = { x: (leftEye[0].x + leftEye[3].x) / 2, y: (leftEye[0].y + leftEye[3].y) / 2 };
    const rightEyeCenter = { x: (rightEye[0].x + rightEye[3].x) / 2, y: (rightEye[0].y + rightEye[3].y) / 2 };
    const eyeWidth = rightEyeCenter.x - leftEyeCenter.x;
    const noseOffset = noseTip.x - eyeCenter.x;
    const yaw = (noseOffset / eyeWidth) * 60;

    // Pitch (up-down rotation)
    const faceHeight = jaw[8].y - eyeCenter.y;
    const noseHeight = noseTip.y - noseBase.y;
    const pitch = ((noseHeight / faceHeight) - 0.5) * 60;

    // Roll (tilt)
    const eyeDeltaY = rightEyeCenter.y - leftEyeCenter.y;
    const eyeDeltaX = rightEyeCenter.x - leftEyeCenter.x;
    const roll = Math.atan2(eyeDeltaY, eyeDeltaX) * (180 / Math.PI);

    return { pitch, yaw, roll };
  };

  const determineAlertLevel = useCallback((currentMetrics: FatigueMetrics): AlertLevel => {
    const { perclos, blinkRate, yawnFrequency, noddingDetected } = currentMetrics;

    if (perclos >= 70 || (noddingDetected && perclos >= 40)) {
      return 'critical';
    }
    if (perclos >= 50 || yawnFrequency >= 5) {
      return 'severe';
    }
    if (perclos >= 35 || yawnFrequency >= 3) {
      return 'fatigued';
    }
    if (perclos >= 25 || blinkRate < 8 || blinkRate > 25) {
      return 'drowsy';
    }
    return 'alert';
  }, []);

  const determineBlinkPattern = (rate: number, timestamps: number[]): FatigueMetrics['blinkPattern'] => {
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
  };

  const startDetection = useCallback((video: HTMLVideoElement, canvas: HTMLCanvasElement) => {
    if (!isModelLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const detect = async () => {
      if (video.paused || video.ended) return;

      const detections = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detections) {
        const landmarks = detections.landmarks;
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();
        const mouth = landmarks.getMouth();

        // Draw landmarks
        ctx.strokeStyle = 'hsl(187, 92%, 50%)';
        ctx.lineWidth = 2;
        
        // Draw face outline
        const jaw = landmarks.getJawOutline();
        ctx.beginPath();
        jaw.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();

        // Draw eyes
        [leftEye, rightEye].forEach(eye => {
          ctx.beginPath();
          eye.forEach((point, i) => {
            if (i === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
          });
          ctx.closePath();
          ctx.stroke();
        });

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
          // Keep only last 60 seconds of blinks
          blinkTimestamps.current = blinkTimestamps.current.filter(t => now - t < 60000);
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
        yawnTimestamps.current = yawnTimestamps.current.filter(t => now - t < 60000);
        const yawnFrequency = yawnTimestamps.current.length;

        // Track head nodding
        headPoseHistory.current.push({ pitch: headPose.pitch, timestamp: now });
        headPoseHistory.current = headPoseHistory.current.filter(h => now - h.timestamp < 3000);
        
        let noddingDetected = false;
        if (headPoseHistory.current.length > 10) {
          const pitches = headPoseHistory.current.map(h => h.pitch);
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
        if (totalFrames.current % 150 === 0) {
          setHistory(prev => [...prev.slice(-60), {
            timestamp: new Date(),
            perclos: newMetrics.perclos,
            alertLevel: determineAlertLevel(newMetrics),
            blinkRate: newMetrics.blinkRate,
            yawnCount: newMetrics.yawnCount,
          }]);
        }
      } else {
        setMetrics(prev => ({ ...prev, faceDetected: false }));
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [isModelLoaded, determineAlertLevel]);

  const stopDetection = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    // Reset counters
    eyeClosedFrames.current = 0;
    totalFrames.current = 0;
    blinkTimestamps.current = [];
    yawnTimestamps.current = [];
    headPoseHistory.current = [];
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
