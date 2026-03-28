import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { notificationsApi } from '@/services/api';
import type { Notification, DeliveryLog, DeliveryStats } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlatformIcon, PlatformChip } from '@/components/shared/PlatformIcons';
import { Button } from '@/components/ui/button';
import { NotificationDetailSkeleton } from '@/components/shared/Skeletons';
import { toast } from 'sonner';
import {
  ArrowLeft, Send, Copy, Pencil, XCircle, RefreshCw,
  Users, Calendar, Wifi,
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const platformLabel: Record<string, string> = {
  ios: 'iOS', android: 'Android', web: 'Web', email: 'Email',
};

const TERMINAL_STATUSES: string[] = ['completed', 'failed', 'cancelled'];

// Simulate live stats progression for a processing notification
function simulateStats(base: DeliveryStats, elapsed: number): DeliveryStats {
  if (!base.total) return base;
  const progress = Math.min(elapsed / 28000, 1); // full in ~28s
  const delivered = Math.round(base.pending * progress * 0.94 + base.delivered);
  const failed    = Math.round(base.pending * progress * 0.06 + base.failed);
  const pending   = Math.max(0, base.total - delivered - failed);
  return { total: base.total, delivered, failed, pending };
}

export default function NotificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [notif, setNotif]           = useState<Notification | null>(null);
  const [liveStats, setLiveStats]   = useState<DeliveryStats | null>(null);
  const [logs, setLogs]             = useState<DeliveryLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPolling, setIsPolling]   = useState(false);

  // Polling refs
  const pollingRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const sentAtRef     = useRef<number | null>(null);
  const baseStatsRef  = useRef<DeliveryStats | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const n = await notificationsApi.getById(id);
    setNotif(n);
    if (n?.stats) setLiveStats(n.stats);
    setLoading(false);
    return n;
  };

  const startPolling = (notifData: Notification) => {
    stopPolling();
    if (TERMINAL_STATUSES.includes(notifData.status)) return;
    if (notifData.status !== 'processing') return;

    sentAtRef.current   = Date.now();
    baseStatsRef.current = notifData.stats ?? { total: 892, delivered: 543, failed: 12, pending: 337 };
    setIsPolling(true);

    let elapsed = 0;
    const tick = async () => {
      elapsed += pollingRef.current ? 0 : 0; // tick driven by interval
      const now = Date.now();
      const timeSinceSend = sentAtRef.current ? now - sentAtRef.current : 0;

      // Animate live stats
      if (baseStatsRef.current) {
        const simulated = simulateStats(baseStatsRef.current, timeSinceSend);
        setLiveStats(simulated);

        // After 30s complete it
        if (timeSinceSend > 30000) {
          setLiveStats({ ...baseStatsRef.current, delivered: baseStatsRef.current.total - baseStatsRef.current.failed, failed: baseStatsRef.current.failed, pending: 0 });
          setNotif((prev) => prev ? { ...prev, status: 'completed' } : prev);
          stopPolling();
          return;
        }
      }

      // Refetch from API every interval
      const fresh = await notificationsApi.getById(id!);
      if (fresh) {
        setNotif(fresh);
        if (TERMINAL_STATUSES.includes(fresh.status)) {
          setLiveStats(fresh.stats ?? null);
          stopPolling();
        }
      }
    };

    // First 30s: 2s interval; after that: 5s interval
    pollingRef.current = setInterval(async () => {
      const timeSinceSend = sentAtRef.current ? Date.now() - sentAtRef.current : 0;
      await tick();
      if (timeSinceSend > 30000 && pollingRef.current) {
        // Switch to 5s polling
        clearInterval(pollingRef.current);
        pollingRef.current = setInterval(tick, 5000);
      }
    }, 2000);
  };

  useEffect(() => {
    load().then((n) => { if (n) startPolling(n); });
    return () => stopPolling();
  }, [id]);

  const loadLogs = async () => {
    if (!id) return;
    setLogsLoading(true);
    const res = await notificationsApi.logs(id);
    setLogs(res.data);
    setLogsLoading(false);
  };

  const handleSendNow = async () => {
    if (!notif) return;
    setActionLoading(true);
    try {
      const updated = await notificationsApi.sendNow(notif.id);
      toast.success('Notification sent!', { description: 'Polling delivery stats…' });
      setNotif(updated);
      startPolling(updated);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!notif) return;
    setActionLoading(true);
    stopPolling();
    try {
      await notificationsApi.cancel(notif.id);
      toast.success('Cancelled');
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!notif) return;
    setActionLoading(true);
    try {
      const copy = await notificationsApi.duplicate(notif.id);
      toast.success('Duplicated', { description: 'A draft copy has been created.' });
      navigate(`/notifications/${copy.id}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <NotificationDetailSkeleton />;
  }

  if (!notif) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <p className="text-muted-foreground">Notification not found</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}>Back to list</Button>
      </div>
    );
  }

  const stats    = liveStats ?? notif.stats;
  const chartData = stats ? [
    { name: 'Delivered', value: stats.delivered, color: 'hsl(142 71% 45%)' },
    { name: 'Failed',    value: stats.failed,    color: 'hsl(0 72% 51%)' },
    { name: 'Pending',   value: stats.pending,   color: 'hsl(213 94% 52%)' },
  ] : [];

  const canEdit   = notif.status === 'draft' || notif.status === 'scheduled';
  const canSend   = notif.status === 'draft';
  const canCancel = notif.status === 'scheduled' || notif.status === 'processing';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button onClick={() => navigate('/notifications')} className="mt-1 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h2 className="text-xl font-bold text-foreground truncate">{notif.title}</h2>
            <StatusBadge status={notif.status} />
            {isPolling && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-status-processing animate-pulse">
                <Wifi className="w-3 h-3" /> Live
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{notif.body}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canSend && (
            <Button size="sm" onClick={handleSendNow} disabled={actionLoading} className="gap-2">
              <Send className="w-3.5 h-3.5" /> Send Now
            </Button>
          )}
          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/notifications/${notif.id}/edit`)} className="gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          )}
          {canCancel && (
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={actionLoading} className="gap-2 text-status-scheduled border-status-scheduled/30">
              <XCircle className="w-3.5 h-3.5" /> Cancel
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={actionLoading} className="gap-2">
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </Button>
          <button onClick={() => load()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Polling banner */}
      {isPolling && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-status-processing/10 border border-status-processing/20 text-status-processing text-xs font-medium"
        >
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          Polling delivery stats every 2s (switches to 5s after 30s) — updates stop when completed or failed.
        </motion.div>
      )}

      <Tabs defaultValue="overview" onValueChange={(v) => { if (v === 'logs') loadLogs(); }}>
        <TabsList className="mb-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Delivery Stats</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5 col-span-2">
              <h3 className="text-sm font-semibold text-foreground mb-4">Details</h3>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Target</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-foreground">
                    <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    {notif.targetType === 'all_users' ? 'All Users' :
                     notif.targetType === 'specific_users' ? `${notif.specificUserIds?.length ?? 0} Users` : 'Segment'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Send Mode</dt>
                  <dd className="text-sm text-foreground capitalize">{notif.sendMode}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Platforms</dt>
                  <dd className="flex items-center gap-1.5 flex-wrap">
                    {notif.platforms.map((p) => (
                      <PlatformChip key={p} platform={p} />
                    ))}
                  </dd>
                </div>
                {notif.link && (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Deep Link</dt>
                    <dd className="text-sm font-mono text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 inline-block overflow-hidden max-w-full truncate">
                      {notif.link}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Created</dt>
                  <dd className="flex items-center gap-1.5 text-sm text-foreground">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {format(new Date(notif.createdAt), 'MMM d, yyyy HH:mm')}
                  </dd>
                </div>
                {notif.scheduledAt && (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Scheduled For</dt>
                    <dd className="text-sm text-status-scheduled font-medium">
                      {format(new Date(notif.scheduledAt), 'MMM d, yyyy HH:mm')}
                    </dd>
                  </div>
                )}
                {notif.sentAt && (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Sent At</dt>
                    <dd className="text-sm text-foreground">{format(new Date(notif.sentAt), 'MMM d, yyyy HH:mm')}</dd>
                  </div>
                )}
              </dl>

              {notif.specificUserIds && notif.specificUserIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Target User IDs</dt>
                  <div className="flex flex-wrap gap-1.5">
                    {notif.specificUserIds.map((uid) => (
                      <span key={uid} className="bg-secondary text-xs font-mono text-muted-foreground px-2 py-0.5 rounded">{uid}</span>
                    ))}
                  </div>
                </div>
              )}

              {notif.segment && Object.values(notif.segment).some(Boolean) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Segment Filters</dt>
                  <div className="flex flex-wrap gap-1.5">
                    {notif.segment.inactiveUsers && <span className="bg-secondary text-xs font-medium text-foreground px-2.5 py-1 rounded-full">Inactive Users</span>}
                    {notif.segment.premiumUsers   && <span className="bg-secondary text-xs font-medium text-foreground px-2.5 py-1 rounded-full">Premium Users</span>}
                    {notif.segment.newUsers       && <span className="bg-secondary text-xs font-medium text-foreground px-2.5 py-1 rounded-full">New Users</span>}
                    {notif.segment.trialUsers     && <span className="bg-secondary text-xs font-medium text-foreground px-2.5 py-1 rounded-full">Trial Users</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Live Stats Cards */}
            {stats && (
              <>
                {[
                  { label: 'Total',     value: stats.total,     color: 'text-foreground' },
                  { label: 'Delivered', value: stats.delivered, color: 'text-status-completed' },
                  { label: 'Failed',    value: stats.failed,    color: 'text-status-failed' },
                  { label: 'Pending',   value: stats.pending,   color: 'text-status-processing' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4 text-center relative overflow-hidden">
                    {isPolling && label !== 'Total' && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-status-processing animate-pulse" />
                    )}
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-semibold">{label}</p>
                    <motion.p
                      key={value}
                      initial={{ scale: 1.05 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`text-2xl font-bold ${color}`}
                    >
                      {value.toLocaleString()}
                    </motion.p>
                    {stats.total > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{((value / stats.total) * 100).toFixed(1)}%</p>
                    )}
                  </div>
                ))}
              </>
            )}
          </motion.div>
        </TabsContent>

        {/* Delivery Stats Tab */}
        <TabsContent value="stats">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-foreground">Delivery Breakdown</h3>
              {isPolling && (
                <span className="flex items-center gap-1.5 text-xs text-status-processing font-medium">
                  <Wifi className="w-3 h-3 animate-pulse" /> Live updates
                </span>
              )}
            </div>
            {stats && stats.total > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      cursor={{ fill: 'hsl(var(--secondary))' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 flex h-2.5 rounded-full overflow-hidden bg-secondary">
                    <motion.div
                      animate={{ width: `${(stats.delivered / stats.total) * 100}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-status-completed"
                    />
                    <motion.div
                      animate={{ width: `${(stats.failed / stats.total) * 100}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-status-failed"
                    />
                    <motion.div
                      animate={{ width: `${(stats.pending / stats.total) * 100}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-status-processing"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {((stats.delivered / stats.total) * 100).toFixed(1)}% success
                  </span>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No delivery data available yet</p>
            )}
          </motion.div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_auto] gap-4 px-5 py-2.5 border-b border-border bg-secondary/30">
              {['User ID', 'Platform', 'Status', 'Timestamp', 'Error'].map((h) => (
                <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</span>
              ))}
            </div>
            {logsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No logs available. Click the Logs tab to load them.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="grid grid-cols-[2fr_1fr_1fr_1.5fr_auto] gap-4 px-5 py-3 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                  <span className="text-xs font-mono text-muted-foreground truncate">{log.userId}</span>
                  <span className="flex items-center gap-1.5 text-xs text-foreground capitalize">
                    <PlatformIcon platform={log.platform} className="w-3.5 h-3.5 text-muted-foreground" />
                    {platformLabel[log.platform]}
                  </span>
                  <span className={`text-xs font-semibold capitalize ${
                    log.status === 'delivered' ? 'text-status-completed' :
                    log.status === 'failed'    ? 'text-status-failed' : 'text-status-processing'
                  }`}>{log.status}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}</span>
                  <span className="text-xs text-status-failed truncate">{log.error ?? '—'}</span>
                </div>
              ))
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
