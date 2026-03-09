import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { notificationsApi } from '@/services/api';
import { type DashboardStats, type Notification } from '@/data/mockData';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/shared/Skeletons';
import {
  Send, Clock, CheckCircle2, XCircle, LayoutTemplate,
  TrendingUp, Plus, ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { PlatformIcon } from '@/components/shared/PlatformIcons';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      notificationsApi.stats(),
      notificationsApi.list().then((list) => list.slice(0, 5)),
    ]).then(([s, r]) => {
      setStats(s);
      setRecent(r);
      setLoading(false);
    });
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Good morning 👋</h2>
          <p className="text-sm text-muted-foreground">Here's what's happening with your notifications</p>
        </div>
        <Button onClick={() => navigate('/notifications/create')} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> New Notification
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Sent"    value={stats?.totalSent ?? 0}                       icon={Send}           delay={0}    change="All time"          changeType="neutral" />
        <StatCard label="Delivered"     value={stats?.delivered ?? 0}                       icon={CheckCircle2}   delay={0.05} change="+2.3% this week"   changeType="positive" />
        <StatCard label="Failed"        value={stats?.failed ?? 0}                          icon={XCircle}        delay={0.1}  change="-0.8% this week"   changeType="positive" />
        <StatCard label="Scheduled"     value={stats?.scheduled ?? 0}                       icon={Clock}          delay={0.15} change="Upcoming"          changeType="neutral" />
        <StatCard label="Delivery Rate" value={stats ? `${stats.deliveryRate}%` : '—'}      icon={TrendingUp}     delay={0.2}  change="Last 30 days"      changeType="neutral" />
        <StatCard label="Templates"     value={stats?.activeTemplates ?? 0}                 icon={LayoutTemplate} delay={0.25} change="Active"            changeType="neutral" />
      </div>

      {/* Delivery Rate Bar */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-lg p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Delivery Breakdown</h3>
            <span className="text-xs text-muted-foreground">Last 30 days</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.delivered / stats.totalSent) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
              className="h-full bg-status-completed rounded-l-full"
            />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(stats.failed / stats.totalSent) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
              className="h-full bg-status-failed rounded-r-full"
            />
          </div>
          <div className="flex gap-5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-completed" />
              <span className="text-muted-foreground">Delivered <strong className="text-foreground">{stats.delivered.toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-status-failed" />
              <span className="text-muted-foreground">Failed <strong className="text-foreground">{stats.failed.toLocaleString()}</strong></span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card border border-border rounded-lg overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Notifications</h3>
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-border">
          {recent.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              onClick={() => navigate(`/notifications/${n.id}`)}
              className="flex items-start gap-4 px-5 py-3.5 hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex gap-1.5">
                  {n.platforms.map((p) => (
                    <span key={p} title={p} className="text-muted-foreground">
                      <PlatformIcon platform={p} className="w-3.5 h-3.5" />
                    </span>
                  ))}
                </div>
                <StatusBadge status={n.status} />
                <span className="text-xs text-muted-foreground">
                  {format(new Date(n.createdAt), 'MMM d')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
