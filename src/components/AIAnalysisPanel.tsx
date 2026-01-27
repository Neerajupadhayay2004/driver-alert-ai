import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Lightbulb, Heart, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FatigueAnalysis } from '@/hooks/useFatigueAnalysis';
import { Button } from '@/components/ui/button';

interface AIAnalysisPanelProps {
  analysis: FatigueAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  onRefresh?: () => void;
  className?: string;
}

const riskColors: Record<FatigueAnalysis['riskLevel'], string> = {
  low: 'text-success border-success/30 bg-success/10',
  moderate: 'text-warning border-warning/30 bg-warning/10',
  high: 'text-critical border-critical/30 bg-critical/10',
  critical: 'text-red-500 border-red-500/30 bg-red-500/10',
};

const riskLabels: Record<FatigueAnalysis['riskLevel'], string> = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

export function AIAnalysisPanel({ analysis, isAnalyzing, error, onRefresh, className }: AIAnalysisPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-panel p-4 sm:p-6", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold">AI Fatigue Analysis</h3>
            <p className="text-xs text-muted-foreground">Powered by Gemini</p>
          </div>
        </div>
        {onRefresh && !isAnalyzing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-8 sm:py-12"
          >
            <div className="relative">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-spin" />
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">Analyzing fatigue patterns...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-critical mx-auto mb-3" />
            <p className="text-sm text-critical">{error}</p>
          </motion.div>
        ) : analysis ? (
          <motion.div
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Risk Level Badge */}
            <div className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-medium",
              riskColors[analysis.riskLevel]
            )}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {riskLabels[analysis.riskLevel]}
            </div>

            {/* Main Analysis */}
            <div className="p-3 sm:p-4 rounded-lg bg-secondary/50">
              <p className="text-sm sm:text-base leading-relaxed">{analysis.analysis}</p>
            </div>

            {/* Warning Sign */}
            {analysis.warningSign && (
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-start gap-2 p-3 rounded-lg bg-critical/10 border border-critical/20"
              >
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-critical shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-critical">Warning Sign</p>
                  <p className="text-xs sm:text-sm text-critical/80">{analysis.warningSign}</p>
                </div>
              </motion.div>
            )}

            {/* Recommendations */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-warning" />
                <h4 className="text-xs sm:text-sm font-medium">Recommendations</h4>
              </div>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <motion.li
                    key={index}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    {rec}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Encouragement */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
              <p className="text-xs sm:text-sm text-primary">{analysis.encouragement}</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8 sm:py-12"
          >
            <Brain className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Start monitoring to receive AI analysis</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Analysis updates every 30 seconds</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
