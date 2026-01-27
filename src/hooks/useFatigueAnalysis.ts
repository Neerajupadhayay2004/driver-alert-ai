import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { FatigueMetrics, AlertLevel } from '@/types/fatigue';

export interface FatigueAnalysis {
  analysis: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendations: string[];
  warningSign: string | null;
  encouragement: string;
}

interface UseFatigueAnalysisReturn {
  analysis: FatigueAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeMetrics: (metrics: FatigueMetrics, alertLevel: AlertLevel) => Promise<void>;
  clearAnalysis: () => void;
}

const ANALYSIS_COOLDOWN = 30000; // 30 seconds between analyses

export function useFatigueAnalysis(): UseFatigueAnalysisReturn {
  const [analysis, setAnalysis] = useState<FatigueAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastAnalysisTime = useRef<number>(0);

  const analyzeMetrics = useCallback(async (metrics: FatigueMetrics, alertLevel: AlertLevel) => {
    const now = Date.now();
    if (now - lastAnalysisTime.current < ANALYSIS_COOLDOWN) {
      return;
    }

    if (!metrics.faceDetected) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    lastAnalysisTime.current = now;

    try {
      const { data, error: funcError } = await supabase.functions.invoke('analyze-fatigue', {
        body: {
          fatigueData: {
            perclos: metrics.perclos,
            blinkRate: metrics.blinkRate,
            blinkPattern: metrics.blinkPattern,
            yawnCount: metrics.yawnCount,
            yawnFrequency: metrics.yawnFrequency,
            headPose: metrics.headPose,
            noddingDetected: metrics.noddingDetected,
            alertLevel,
          },
        },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data as FatigueAnalysis);
    } catch (err) {
      console.error('Fatigue analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    analyzeMetrics,
    clearAnalysis,
  };
}
