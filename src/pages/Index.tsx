import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { WebcamFeed } from '@/components/WebcamFeed';
import { MetricsPanel } from '@/components/MetricsPanel';
import { AlertSystem } from '@/components/AlertSystem';
import { Head3DViewer } from '@/components/Head3DViewer';
import { TrendChart, AlertTimeline } from '@/components/TrendChart';
import { AIAnalysisPanel } from '@/components/AIAnalysisPanel';
import { VisionIndicators } from '@/components/VisionIndicators';
import { useFatigueAnalysis } from '@/hooks/useFatigueAnalysis';
import type { FatigueMetrics, AlertLevel, FatigueHistory } from '@/types/fatigue';

// Preload models immediately
import '@/lib/faceApiLoader';

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

const Index = () => {
  const [metrics, setMetrics] = useState<FatigueMetrics>(defaultMetrics);
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('alert');
  const [history, setHistory] = useState<FatigueHistory[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { analysis, isAnalyzing, error: analysisError, analyzeMetrics, clearAnalysis } = useFatigueAnalysis();

  const handleMetricsUpdate = useCallback((newMetrics: FatigueMetrics) => {
    setMetrics(newMetrics);
    if (newMetrics.faceDetected) {
      setIsMonitoring(true);
    }
  }, []);

  const handleAlertLevelChange = useCallback((level: AlertLevel) => {
    setAlertLevel(level);
  }, []);

  const handleHistoryUpdate = useCallback((newHistory: FatigueHistory[]) => {
    setHistory(newHistory);
  }, []);

  // Trigger AI analysis periodically when monitoring
  useEffect(() => {
    if (isMonitoring && metrics.faceDetected) {
      analyzeMetrics(metrics, alertLevel);
    }
  }, [isMonitoring, metrics.faceDetected, history.length, analyzeMetrics, metrics, alertLevel]);

  const handleRefreshAnalysis = useCallback(() => {
    if (metrics.faceDetected) {
      analyzeMetrics(metrics, alertLevel);
    }
  }, [metrics, alertLevel, analyzeMetrics]);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Main grid layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column - Video feed and charts */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Alert System */}
            <AlertSystem
              level={alertLevel}
              metrics={{
                perclos: metrics.perclos,
                blinkRate: metrics.blinkRate,
                yawnFrequency: metrics.yawnFrequency,
                noddingDetected: metrics.noddingDetected,
              }}
            />

            {/* Video and 3D section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Webcam Feed */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wider">
                  Live Camera Feed
                </h2>
                <WebcamFeed
                  onMetricsUpdate={handleMetricsUpdate}
                  onAlertLevelChange={handleAlertLevelChange}
                  onHistoryUpdate={handleHistoryUpdate}
                />
              </motion.div>

              {/* 3D Head Viewer */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wider">
                  Head Pose 3D Visualization
                </h2>
                <div className="head-3d-container h-[220px] sm:h-[260px] lg:h-[320px]">
                  <Head3DViewer
                    pitch={metrics.headPose.pitch}
                    yaw={metrics.headPose.yaw}
                    roll={metrics.headPose.roll}
                  />
                </div>
              </motion.div>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <TrendChart data={history} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <AlertTimeline data={history} />
              </motion.div>
            </div>

            {/* Vision-Based Indicators Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <h2 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wider">
                Vision-Based Indicators
              </h2>
              <VisionIndicators metrics={metrics} />
            </motion.div>

            {/* AI Analysis Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <AIAnalysisPanel
                analysis={analysis}
                isAnalyzing={isAnalyzing}
                error={analysisError}
                onRefresh={handleRefreshAnalysis}
              />
            </motion.div>
          </div>

          {/* Right column - Metrics panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:col-span-1"
          >
            <MetricsPanel metrics={metrics} alertLevel={alertLevel} />
          </motion.div>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 text-center text-[10px] sm:text-xs text-muted-foreground"
        >
          <p>
            DriveGuard AI uses advanced computer vision to monitor driver alertness in real-time.
            <br className="hidden sm:block" />
            <span className="hidden sm:inline"> </span>For safety, always ensure proper rest before driving.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
