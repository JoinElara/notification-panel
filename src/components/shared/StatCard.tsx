import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, change, changeType = 'neutral', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: 'easeOut' }}
      className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow group"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/5 transition-colors">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.1 }}
          className="text-2xl font-bold text-foreground tracking-tight"
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </motion.div>
        {change && (
          <p
            className={`text-xs mt-0.5 font-medium ${
              changeType === 'positive'
                ? 'text-status-completed'
                : changeType === 'negative'
                ? 'text-status-failed'
                : 'text-muted-foreground'
            }`}
          >
            {change}
          </p>
        )}
      </div>
    </motion.div>
  );
}
