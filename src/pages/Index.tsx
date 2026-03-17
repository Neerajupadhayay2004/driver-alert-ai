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
  perclos: 0, blinkRate: 15, blinkPattern: 'normal',
  yawnCount: 0, yawnFrequency: 0, mouthOpenRatio: 0,
  headPose: { pitch: 0, yaw: 0, roll: 0 },
  noddingDetected: false, eyesOpen: true, faceDetected: false,
};

const Index = () => {
  const [metrics, setMetrics] = useState<FatigueMetrics>(defaultMetrics);
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('alert');
  const [history, setHistory] = useState<FatigueHistory[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const { analysis, isAnalyzing, error: analysisError, analyzeMetrics, clearAnalysis } = useFatigueAnalysis();

  const handleMetricsUpdate = useCallback((newMetrics: FatigueMetrics) => {
    setMetrics(newMetrics);
    if (newMetrics.faceDetected) setIsMonitoring(true);
  }, []);

  const handleAlertLevelChange = useCallback((level: AlertLevel) => { setAlertLevel(level); }, []);
  const handleHistoryUpdate = useCallback((newHistory: FatigueHistory[]) => { setHistory(newHistory); }, []);

  useEffect(() => {
    if (isMonitoring && metrics.faceDetected) {
      analyzeMetrics(metrics, alertLevel);
    }
  }, [isMonitoring, metrics.faceDetected, history.length, analyzeMetrics, metrics, alertLevel]);

  const handleRefreshAnalysis = useCallback(() => {
    if (metrics.faceDetected) analyzeMetrics(metrics, alertLevel);
  }, [metrics, alertLevel, analyzeMetrics]);

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-[1600px]">
        {/* Alert System - Full width */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 sm:mb-6">
          <AlertSystem
            level={alertLevel}
            metrics={{
              perclos: metrics.perclos, blinkRate: metrics.blinkRate,
              yawnFrequency: metrics.yawnFrequency, noddingDetected: metrics.noddingDetected,
            }}
          />
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
          {/* Left column - Camera + Charts */}
          <div className="xl:col-span-8 space-y-4 sm:space-y-6">
            {/* Video + 3D side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <h2 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Live Camera Feed
                </h2>
                <WebcamFeed
                  onMetricsUpdate={handleMetricsUpdate}
                  onAlertLevelChange={handleAlertLevelChange}
                  onHistoryUpdate={handleHistoryUpdate}
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <h2 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Head Pose 3D
                </h2>
                <div className="head-3d-container h-[220px] sm:h-[260px] lg:h-[320px]">
                  <Head3DViewer pitch={metrics.headPose.pitch} yaw={metrics.headPose.yaw} roll={metrics.headPose.roll} />
                </div>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <TrendChart data={history} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <AlertTimeline data={history} />
              </motion.div>
            </div>

            {/* Vision Indicators */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <h2 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Vision-Based Indicators
              </h2>
              <VisionIndicators metrics={metrics} />
            </motion.div>

            {/* AI Analysis */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <AIAnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} error={analysisError} onRefresh={handleRefreshAnalysis} />
            </motion.div>
          </div>

          {/* Right column - Metrics panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="xl:col-span-4">
            <div className="xl:sticky xl:top-20">
              <MetricsPanel metrics={metrics} alertLevel={alertLevel} />
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-8 sm:mt-12 text-center py-6 border-t border-border/30">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            DriveGuard AI — Advanced Computer Vision Driver Monitoring System
          </p>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground/60 mt-1">
            Real-time PERCLOS • Blink Analysis • Yawn Detection • Head Pose Estimation • AI-Powered Insights
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Index;
