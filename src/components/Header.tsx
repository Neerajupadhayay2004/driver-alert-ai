import { motion } from 'framer-motion';
import { Shield, Activity, Eye, Brain, Zap, Bell } from 'lucide-react';

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card border-b border-border/50 sticky top-0 z-50"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">DriveGuard AI</h1>
              <p className="text-xs text-muted-foreground">Fatigue Detection System</p>
            </div>
          </div>

          {/* Status indicators */}
          <div className="hidden md:flex items-center gap-6">
            <StatusIndicator icon={<Eye className="w-4 h-4" />} label="Vision" active />
            <StatusIndicator icon={<Brain className="w-4 h-4" />} label="AI Model" active />
            <StatusIndicator icon={<Activity className="w-4 h-4" />} label="Analysis" active />
            <StatusIndicator icon={<Zap className="w-4 h-4" />} label="Real-time" active />
          </div>

          {/* Alert button */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

interface StatusIndicatorProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

function StatusIndicator({ icon, label, active }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-lg ${active ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
        {icon}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
