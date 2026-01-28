import { motion } from 'framer-motion';
import { Shield, Activity, Eye, Brain, Zap, Bell, Settings, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { faceApiLoader } from '@/lib/faceApiLoader';
import { cn } from '@/lib/utils';

export function Header() {
  const [modelReady, setModelReady] = useState(faceApiLoader.loaded);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    return faceApiLoader.subscribe((loaded) => {
      setModelReady(loaded);
    });
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card border-b border-border/50 sticky top-0 z-50"
    >
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <motion.div
                className={cn(
                  'absolute -top-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full',
                  modelReady ? 'bg-success' : 'bg-warning'
                )}
                animate={modelReady ? { scale: [1, 1.2, 1] } : { opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold gradient-text">DriveGuard AI</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {modelReady ? 'System Ready' : 'Initializing...'}
              </p>
            </div>
          </div>

          {/* Status indicators - Desktop */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            <StatusIndicator
              icon={<Eye className="w-4 h-4" />}
              label="Vision"
              active={modelReady}
            />
            <StatusIndicator
              icon={<Brain className="w-4 h-4" />}
              label="AI Model"
              active={modelReady}
            />
            <StatusIndicator
              icon={<Activity className="w-4 h-4" />}
              label="Analysis"
              active={modelReady}
            />
            <StatusIndicator
              icon={<Zap className="w-4 h-4" />}
              label="Real-time"
              active={modelReady}
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Status pill - Mobile/Tablet */}
            <div className="lg:hidden">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors',
                  modelReady
                    ? 'bg-success/20 text-success'
                    : 'bg-warning/20 text-warning'
                )}
              >
                <div
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    modelReady ? 'bg-success' : 'bg-warning animate-pulse'
                  )}
                />
                <span className="hidden sm:inline">{modelReady ? 'Ready' : 'Loading'}</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:flex relative p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Settings className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={false}
          animate={{ height: menuOpen ? 'auto' : 0, opacity: menuOpen ? 1 : 0 }}
          className="lg:hidden overflow-hidden"
        >
          <div className="pt-3 pb-1 grid grid-cols-4 gap-2">
            <StatusIndicatorMobile icon={<Eye className="w-4 h-4" />} label="Vision" active={modelReady} />
            <StatusIndicatorMobile icon={<Brain className="w-4 h-4" />} label="AI" active={modelReady} />
            <StatusIndicatorMobile icon={<Activity className="w-4 h-4" />} label="Analysis" active={modelReady} />
            <StatusIndicatorMobile icon={<Zap className="w-4 h-4" />} label="Realtime" active={modelReady} />
          </div>
        </motion.div>
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
    <motion.div
      className="flex items-center gap-2"
      whileHover={{ scale: 1.02 }}
    >
      <div
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          active ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
        )}
      >
        {icon}
      </div>
      <span className={cn('text-xs', active ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </motion.div>
  );
}

function StatusIndicatorMobile({ icon, label, active }: StatusIndicatorProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1 py-2 rounded-lg transition-colors',
        active ? 'bg-primary/10' : 'bg-secondary/50'
      )}
    >
      <div className={cn('p-1.5 rounded-lg', active ? 'text-primary' : 'text-muted-foreground')}>
        {icon}
      </div>
      <span className={cn('text-[10px]', active ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
    </div>
  );
}
