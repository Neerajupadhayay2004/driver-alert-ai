import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, Loader2, AlertCircle } from 'lucide-react';
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div className={cn(
        "video-container aspect-video bg-secondary relative",
        !isStreaming && "flex items-center justify-center"
      )}>
        {/* Video element */}
        <video
          ref={videoRef}
          className={cn(
            "w-full h-full object-cover",
            !isStreaming && "hidden"
          )}
          playsInline
          muted
        />
        
        {/* Canvas overlay for landmarks */}
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 w-full h-full",
            !isStreaming && "hidden"
          )}
        />

        {/* Scanning line effect */}
        {isStreaming && isActive && (
          <div className="scan-line" />
        )}

        {/* Corner overlays */}
        {isStreaming && (
          <>
            <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-primary opacity-70" />
            <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 border-primary opacity-70" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 border-primary opacity-70" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-primary opacity-70" />
          </>
        )}

        {/* Status overlay */}
        {isStreaming && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <div className={cn(
              "status-dot",
              metrics.faceDetected ? "status-dot-active" : "status-dot-warning"
            )} />
            <span className="text-xs font-medium">
              {metrics.faceDetected ? 'Face Detected' : 'Searching...'}
            </span>
          </div>
        )}

        {/* Recording indicator */}
        {isStreaming && isActive && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-critical animate-pulse" />
            <span className="text-xs font-medium text-critical">LIVE</span>
          </div>
        )}

        {/* Placeholder when not streaming */}
        {!isStreaming && (
          <div className="flex flex-col items-center justify-center text-center p-8">
            {modelLoading ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Loading AI models...</p>
              </>
            ) : error ? (
              <>
                <AlertCircle className="w-12 h-12 text-critical mb-4" />
                <p className="text-critical">{error}</p>
              </>
            ) : (
              <>
                <Camera className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Click Start to begin monitoring</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
        <Button
          onClick={handleToggle}
          disabled={modelLoading || !!modelError}
          variant={isActive ? "destructive" : "default"}
          size="lg"
          className={cn(
            "rounded-full w-14 h-14 p-0 shadow-lg",
            !isActive && "animate-glow-pulse"
          )}
        >
          {modelLoading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isActive ? (
            <CameraOff className="w-6 h-6" />
          ) : (
            <Camera className="w-6 h-6" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}
