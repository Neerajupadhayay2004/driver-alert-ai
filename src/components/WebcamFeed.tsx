import { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  CameraOff, 
  Loader2, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Zap,
  Eye,
  EyeOff,
  Activity,
  Shield,
  ShieldAlert,
  Maximize2,
  Settings
} from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() });
  const containerRef = useRef<HTMLDivElement>(null);

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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const error = webcamError || modelError;

  const statusInfo = useMemo(() => {
    if (modelLoading) return { text: 'Loading AI...', color: 'text-primary', icon: Loader2 };
    if (error) return { text: 'Error', color: 'text-critical', icon: AlertCircle };
    if (!isModelLoaded) return { text: 'Initializing...', color: 'text-warning', icon: Settings };
    if (!isStreaming) return { text: 'Ready', color: 'text-success', icon: Shield };
    if (!metrics.faceDetected) return { text: 'Searching...', color: 'text-warning', icon: Eye };
    return { text: 'Tracking', color: 'text-success', icon: Shield };
  }, [modelLoading, error, isModelLoaded, isStreaming, metrics.faceDetected]);

  const alertColor = useMemo(() => {
    switch (alertLevel) {
      case 'critical': return 'border-critical shadow-critical/30';
      case 'severe': return 'border-critical/70 shadow-critical/20';
      case 'fatigued': return 'border-warning shadow-warning/20';
      case 'drowsy': return 'border-warning/70 shadow-warning/10';
      default: return 'border-primary/30 shadow-primary/10';
    }
  }, [alertLevel]);

  const StatusIcon = statusInfo.icon;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      <div
        className={cn(
          'video-container aspect-video bg-gradient-to-br from-secondary/80 to-secondary/40 relative overflow-hidden transition-all duration-300',
          isStreaming && `border-2 ${alertColor} shadow-lg`,
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

        {/* Grid overlay effect */}
        <AnimatePresence>
          {isStreaming && isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            />
          )}
        </AnimatePresence>

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
                  animate={{ opacity: 0.8, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'absolute w-6 h-6 sm:w-8 sm:h-8',
                    alertLevel === 'critical' || alertLevel === 'severe' ? 'border-critical' : 'border-primary',
                    pos
                  )}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Face Detection Box Animation */}
        <AnimatePresence>
          {isStreaming && metrics.faceDetected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                className={cn(
                  "w-32 h-40 sm:w-40 sm:h-52 border-2 rounded-xl",
                  alertLevel === 'critical' ? 'border-critical' :
                  alertLevel === 'severe' ? 'border-critical/70' :
                  alertLevel === 'fatigued' || alertLevel === 'drowsy' ? 'border-warning' :
                  'border-primary'
                )}
                animate={{
                  boxShadow: [
                    '0 0 10px rgba(0,255,255,0.3)',
                    '0 0 20px rgba(0,255,255,0.5)',
                    '0 0 10px rgba(0,255,255,0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {/* Face crosshairs */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30" />
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-primary/30" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status overlays */}
        {isStreaming && (
          <>
            {/* Top left - Face & Eye Status */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-2 left-2 sm:top-3 sm:left-3 space-y-1.5"
            >
              {/* Face Status */}
              <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-border/50">
                <motion.div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    metrics.faceDetected ? 'bg-success' : 'bg-warning'
                  )}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className="text-[10px] sm:text-xs font-medium">
                  {metrics.faceDetected ? 'Face Detected' : 'Searching...'}
                </span>
              </div>

              {/* Eye Status - Only show when face detected */}
              <AnimatePresence>
                {metrics.faceDetected && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex items-center gap-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-border/50"
                  >
                    {metrics.eyesOpen ? (
                      <Eye className="w-3 h-3 text-success" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-warning" />
                    )}
                    <span className={cn(
                      "text-[10px] sm:text-xs font-medium",
                      metrics.eyesOpen ? "text-success" : "text-warning"
                    )}>
                      {metrics.eyesOpen ? 'Eyes Open' : 'Eyes Closed'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Top right - Stats */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col items-end gap-1.5"
            >
              {isActive && (
                <>
                  {/* FPS Counter */}
                  <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-border/50">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] sm:text-xs font-mono font-medium">{fps} FPS</span>
                  </div>
                  
                  {/* LIVE indicator */}
                  <div className="flex items-center gap-1.5 bg-critical/90 px-2 py-1 rounded-lg">
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-white"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-[10px] sm:text-xs font-bold text-white">LIVE</span>
                  </div>

                  {/* Fullscreen button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 bg-background/90 backdrop-blur-sm border border-border/50"
                    onClick={toggleFullscreen}
                  >
                    <Maximize2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </motion.div>

            {/* Bottom left - Connection & AI Status */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 flex items-center gap-2"
            >
              <div className="flex items-center gap-1.5 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-border/50">
                {metrics.faceDetected ? (
                  <Wifi className="w-3 h-3 text-success" />
                ) : (
                  <WifiOff className="w-3 h-3 text-warning" />
                )}
                <StatusIcon className={cn('w-3 h-3', statusInfo.color, modelLoading && 'animate-spin')} />
                <span className={cn('text-[10px] sm:text-xs font-medium', statusInfo.color)}>
                  {statusInfo.text}
                </span>
              </div>
            </motion.div>

            {/* Bottom right - Quick Metrics */}
            <AnimatePresence>
              {metrics.faceDetected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3"
                >
                  <div className="flex items-center gap-2">
                    {/* PERCLOS */}
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-mono font-bold",
                      metrics.perclos >= 50 ? "bg-critical/90 text-white" :
                      metrics.perclos >= 25 ? "bg-warning/90 text-foreground" :
                      "bg-success/90 text-white"
                    )}>
                      <span>PERCLOS</span>
                      <span>{metrics.perclos.toFixed(1)}%</span>
                    </div>
                    
                    {/* Blink Rate */}
                    <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-border/50">
                      <Activity className="w-3 h-3 text-primary" />
                      <span className="text-[10px] sm:text-xs font-mono">{metrics.blinkRate}/min</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alert Level Banner */}
            <AnimatePresence>
              {alertLevel !== 'alert' && metrics.faceDetected && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 rounded-xl",
                    "backdrop-blur-md border-2",
                    alertLevel === 'critical' && "bg-critical/80 border-critical text-white",
                    alertLevel === 'severe' && "bg-critical/60 border-critical/80 text-white",
                    alertLevel === 'fatigued' && "bg-warning/80 border-warning text-foreground",
                    alertLevel === 'drowsy' && "bg-warning/60 border-warning/80 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-sm sm:text-base font-bold uppercase tracking-wider">
                      {alertLevel === 'critical' ? '⚠️ CRITICAL' :
                       alertLevel === 'severe' ? '⚠️ SEVERE' :
                       alertLevel === 'fatigued' ? 'FATIGUED' : 'DROWSY'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                  
                  {/* Loading progress indicator */}
                  <div className="w-48 h-1.5 bg-secondary rounded-full mt-4 overflow-hidden">
                    <motion.div 
                      className="h-full bg-primary rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, ease: "easeOut" }}
                    />
                  </div>
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
                    <motion.div 
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/30"
                      animate={{ boxShadow: ['0 0 20px rgba(0,255,255,0.2)', '0 0 40px rgba(0,255,255,0.4)', '0 0 20px rgba(0,255,255,0.2)'] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                    </motion.div>
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/50"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full border border-primary/30"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                  </div>
                  <p className="text-base sm:text-lg text-foreground font-semibold">Ready to Monitor</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">Click Start to begin real-time detection</p>
                  
                  {/* Feature highlights */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['Eye Tracking', 'Blink Detection', 'Yawn Detection', 'Head Pose'].map((feature, i) => (
                      <motion.span
                        key={feature}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * i }}
                        className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20"
                      >
                        {feature}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute -bottom-5 sm:-bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
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
