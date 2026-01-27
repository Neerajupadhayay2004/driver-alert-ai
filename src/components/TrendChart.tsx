import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import type { FatigueHistory, AlertLevel } from '@/types/fatigue';
import { format } from 'date-fns';

interface TrendChartProps {
  data: FatigueHistory[];
  height?: number;
}

const alertLevelColors: Record<AlertLevel, string> = {
  alert: '#22c55e',
  drowsy: '#f59e0b',
  fatigued: '#f97316',
  severe: '#ef4444',
  critical: '#dc2626',
};

export function TrendChart({ data, height = 200 }: TrendChartProps) {
  const chartData = data.map((item, index) => ({
    time: format(item.timestamp, 'HH:mm:ss'),
    perclos: item.perclos,
    blinkRate: item.blinkRate,
    yawnCount: item.yawnCount,
    alertLevel: item.alertLevel,
    color: alertLevelColors[item.alertLevel],
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="chart-container"
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
        Fatigue Trend Analysis
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="perclosGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="blinkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(215 20% 60%)"
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            stroke="hsl(215 20% 60%)"
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(222 47% 8%)',
              border: '1px solid hsl(222 30% 18%)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="perclos"
            stroke="#00d4ff"
            fill="url(#perclosGradient)"
            strokeWidth={2}
            name="PERCLOS %"
          />
          <Area
            type="monotone"
            dataKey="blinkRate"
            stroke="#f59e0b"
            fill="url(#blinkGradient)"
            strokeWidth={2}
            name="Blink Rate"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

interface AlertTimelineProps {
  data: FatigueHistory[];
}

export function AlertTimeline({ data }: AlertTimelineProps) {
  const recentData = data.slice(-20);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="chart-container"
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
        Alert Level Timeline
      </h3>
      <div className="flex gap-1 items-end h-20 overflow-hidden">
        {recentData.map((item, index) => {
          const heightMap: Record<AlertLevel, number> = {
            alert: 20,
            drowsy: 40,
            fatigued: 60,
            severe: 80,
            critical: 100,
          };
          
          return (
            <motion.div
              key={index}
              initial={{ height: 0 }}
              animate={{ height: `${heightMap[item.alertLevel]}%` }}
              className="flex-1 min-w-[8px] rounded-t"
              style={{ 
                backgroundColor: alertLevelColors[item.alertLevel],
                boxShadow: `0 0 10px ${alertLevelColors[item.alertLevel]}40`,
              }}
            />
          );
        })}
        {recentData.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Collecting data...
          </div>
        )}
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Older</span>
        <span>Recent</span>
      </div>
    </motion.div>
  );
}
