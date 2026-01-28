import { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Loader2, AlertCircle, Wifi, WifiOff, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebcam } from '@/hooks/useWebcam';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { cn } from '@/lib/utils';

interface WebcamFeedProps {
  onMetricsUpdate?: (metrics: ReturnType<typeof useFaceDetection>['metrics']) => void;
  onAlertLevelChange?: (level: ReturnType<typeof useFaceDetection>['alertLevel']) => void;
  onHistoryUpdate?: (history: ReturnType<typeof useFaceDetection>['history']) => void;
}

export function WebcamFeed({ onMetricsUpdate, onAlertLevelChange, onHistoryUpdate }: WebcamFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { videoRef, isStreaming, error: webcamError, startWebcam, stopWebcam } = useWebcam();
  const {
    isLoading: modelLoading,
    isModelLoaded,
    error: modelError,
    metrics,
    alertLevel,
    history,
    startDetection,
    stopDetection,
  } = useFaceDetection();

  const [isActive, setIsActive] = useState(false);
  const [fps, setFps] = useState(0);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() });

  // FPS counter
  useEffect(() => {
    if (!isActive || !isStreaming) return;

    const interval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - fpsRef.current.lastTime;
      setFps(Math.round((fpsRef.current.frames / elapsed) * 1000));
      fpsRef.current.frames = 0;
      fpsRef.current.lastTime = now;
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isStreaming]);

  // Count frames
  useEffect(() => {
    if (metrics.faceDetected) {
      fpsRef.current.frames++;
    }
  }, [metrics]);

  useEffect(() => {
    onMetricsUpdate?.(metrics);
  }, [metrics, onMetricsUpdate]);

  useEffect(() => {
    onAlertLevelChange?.(alertLevel);
  }, [alertLevel, onAlertLevelChange]);

  useEffect(() => {
    onHistoryUpdate?.(history);
  }, [history, onHistoryUpdate]);

  useEffect(() => {
    if (isStreaming && isModelLoaded && videoRef.current && canvasRef.current && isActive) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      startDetection(videoRef.current, canvasRef.current);
    }

    return () => {
      stopDetection();
    };
  }, [isStreaming, isModelLoaded, isActive, startDetection, stopDetection, videoRef]);

  const handleToggle = async () => {
    if (isActive) {
      stopDetection();
      stopWebcam();
      setIsActive(false);
    } else {
      await startWebcam();
      setIsActive(true);
    }
  };

  const error = webcamError || modelError;

  const statusInfo = useMemo(() => {
    if (modelLoading) return { text: 'Loading AI...', color: 'text-primary' };
    if (error) return { text: 'Error', color: 'text-critical' };
    if (!isModelLoaded) return { text: 'Initializing...', color: 'text-warning' };
    if (!isStreaming) return { text: 'Ready', color: 'text-success' };
    if (!metrics.faceDetected) return { text: 'Searching...', color: 'text-warning' };
    return { text: 'Tracking', color: 'text-success' };
  }, [modelLoading, error, isModelLoaded, isStreaming, metrics.faceDetected]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div
        className={cn(
          'video-container aspect-video bg-gradient-to-br from-secondary/80 to-secondary/40 relative overflow-hidden',
          !isStreaming && 'flex items-center justify-center'
        )}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          className={cn('w-full h-full object-cover', !isStreaming && 'hidden')}
          playsInline
          muted
        />

        {/* Canvas overlay for landmarks */}
        <canvas
          ref={canvasRef}
          className={cn('absolute inset-0 w-full h-full', !isStreaming && 'hidden')}
        />

        {/* Scanning line effect */}
        <AnimatePresence>
          {isStreaming && isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="scan-line"
            />
          )}
        </AnimatePresence>

        {/* Corner overlays with animation */}
        <AnimatePresence>
          {isStreaming && (
            <>
              {[
                'top-2 left-2 border-l-2 border-t-2',
                'top-2 right-2 border-r-2 border-t-2',
                'bottom-2 left-2 border-l-2 border-b-2',
                'bottom-2 right-2 border-r-2 border-b-2',
              ].map((pos, i) => (
                <motion.div
                  key={pos}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn('absolute w-6 h-6 sm:w-8 sm:h-8 border-primary', pos)}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Status overlays */}
        {isStreaming && (
          <>
            {/* Face status */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-2"
            >
              <div
                className={cn(
                  'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full',
                  metrics.faceDetected ? 'bg-success animate-pulse' : 'bg-warning animate-pulse'
                )}
              />
              <span className="text-[10px] sm:text-xs font-medium bg-background/80 px-2 py-0.5 rounded">
                {metrics.faceDetected ? 'Face Detected' : 'Searching...'}
              </span>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-2"
            >
              {isActive && (
                <>
                  <div className="flex items-center gap-1 bg-background/80 px-2 py-0.5 rounded">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] sm:text-xs font-mono">{fps} FPS</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-critical/90 px-2 py-0.5 rounded">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-bold text-white">LIVE</span>
                  </div>
                </>
              )}
            </motion.div>

            {/* Connection indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4"
            >
              <div className="flex items-center gap-1.5 bg-background/80 px-2 py-0.5 rounded">
                {metrics.faceDetected ? (
                  <Wifi className="w-3 h-3 text-success" />
                ) : (
                  <WifiOff className="w-3 h-3 text-warning" />
                )}
                <span className={cn('text-[10px] sm:text-xs', statusInfo.color)}>{statusInfo.text}</span>
              </div>
            </motion.div>
          </>
        )}

        {/* Placeholder when not streaming */}
        {!isStreaming && (
          <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {modelLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground mt-4">Loading AI models...</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">This only happens once</p>
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <AlertCircle className="w-12 h-12 sm:w-14 sm:h-14 text-critical mb-3" />
                  <p className="text-sm sm:text-base text-critical text-center max-w-xs">{error}</p>
                </motion.div>
              ) : (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                    </div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <p className="text-sm sm:text-base text-foreground font-medium">Ready to Monitor</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Click Start to begin</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2">
        <Button
          onClick={handleToggle}
          disabled={modelLoading || !!modelError}
          variant={isActive ? 'destructive' : 'default'}
          size="lg"
          className={cn(
            'rounded-full w-12 h-12 sm:w-14 sm:h-14 p-0 shadow-lg transition-all',
            !isActive && !modelLoading && 'animate-glow-pulse hover:scale-110',
            isActive && 'hover:scale-95'
          )}
        >
          {modelLoading ? (
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
          ) : isActive ? (
            <CameraOff className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}
