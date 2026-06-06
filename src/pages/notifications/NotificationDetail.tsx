import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { notificationsApi } from '@/services/api';
import type {
  Notification,
  DeliveryLog,
  DeliveryStats,
  LogPageSummary,
  NotificationDeliveryStats,
  Platform,
} from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlatformIcon, PlatformChip } from '@/components/shared/PlatformIcons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationDetailSkeleton } from '@/components/shared/Skeletons';
import { toast } from 'sonner';
import {
  ArrowLeft, Send, Copy, Pencil, XCircle, RefreshCw,
  Users, Calendar, Wifi, ChevronLeft, ChevronRight, Mail,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const platformLabel: Record<string, string> = {
  ios: 'iOS', android: 'Android', web: 'Web', email: 'Email',
};

const TERMINAL_STATUSES: string[] = ['completed', 'failed', 'cancelled'];

function toDeliveryStats(stats: NotificationDeliveryStats): DeliveryStats {
  const success = stats.sent + stats.delivered;
  return {
    total: stats.total,
    delivered: success,
    failed: stats.failed,
    pending: stats.pending,
  };
}

function logStatusClass(status: DeliveryLog['status']): string {
  if (status === 'sent' || status === 'delivered') return 'text-status-completed';
  if (status === 'failed') return 'text-status-failed';
  if (status === 'skipped') return 'text-muted-foreground';
  return 'text-status-processing';
}

function formatLogTimestamp(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : format(d, 'MMM d, yyyy HH:mm:ss');
}

function LogDetailField({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  onCopy?: () => void;
}) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <div className="flex items-start gap-2">
        <p className={`text-sm text-foreground break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="shrink-0 p-1 rounded hover:bg-secondary text-muted-foreground"
            aria-label={`Copy ${label}`}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function formatLogStatus(status: DeliveryLog['status']): string {
  if (status === 'sent') return 'Sent';
  if (status === 'delivered') return 'Delivered';
  if (status === 'failed') return 'Failed';
  if (status === 'queued') return 'Queued';
  if (status === 'skipped') return 'Skipped';
  return 'Pending';
}

const LOG_PAGE_SIZES = [25, 50, 100] as const;

export default function NotificationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [notif, setNotif] = useState<Notification | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<NotificationDeliveryStats | null>(null);
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [logSummary, setLogSummary] = useState<LogPageSummary | null>(null);
  const [logMeta, setLogMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [logPageLimit, setLogPageLimit] = useState(50);
  const [logPlatform, setLogPlatform] = useState<string>('all');
  const [logStatus, setLogStatus] = useState<string>('all');
  const [logSearch, setLogSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<DeliveryLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };

  const loadStats = useCallback(async () => {
    if (!id) return;
    const stats = await notificationsApi.deliveryStats(id);
    setDeliveryStats(stats);
  }, [id]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const n = await notificationsApi.getById(id);
    setNotif(n);
    await loadStats();
    setLoading(false);
    return n;
  };

  const startPolling = (notifData: Notification) => {
    stopPolling();
    if (TERMINAL_STATUSES.includes(notifData.status)) return;
    if (notifData.status !== 'processing') return;

    setIsPolling(true);
    pollingRef.current = setInterval(async () => {
      const fresh = await notificationsApi.getById(id!);
      if (fresh) {
        setNotif(fresh);
        await loadStats();
        if (TERMINAL_STATUSES.includes(fresh.status)) {
          stopPolling();
        }
      }
    }, 3000);
  };

  useEffect(() => {
    load().then((n) => { if (n) startPolling(n); });
    return () => stopPolling();
  }, [id]);

  const loadLogs = useCallback(async (
    page = 1,
    overrides?: { platform?: string; status?: string; search?: string; limit?: number },
  ) => {
    if (!id) return;
    const platform = overrides?.platform ?? logPlatform;
    const status = overrides?.status ?? logStatus;
    const search = overrides?.search ?? logSearch;
    const limit = overrides?.limit ?? logPageLimit;
    const apiStatus =
      status === 'delivered' ? 'sent' : status !== 'all' ? status : undefined;

    setLogsLoading(true);
    try {
      const res = await notificationsApi.logs(id, {
        page,
        limit,
        platform: platform !== 'all' ? platform : undefined,
        status: apiStatus,
        search: search || undefined,
      });
      setLogs(res.data);
      setLogMeta(res.meta);
      setLogSummary(res.summary ?? null);
      setSelectedLog(null);
    } finally {
      setLogsLoading(false);
    }
  }, [id, logPlatform, logStatus, logSearch, logPageLimit]);

  const handleSendNow = async () => {
    if (!notif) return;
    setActionLoading(true);
    try {
      const updated = await notificationsApi.sendNow(notif.id);
      toast.success('Notification sent!', { description: 'Polling delivery stats…' });
      setNotif(updated);
      await loadStats();
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

  const handleCopyFailedIds = async () => {
    if (!notif) return;
    setActionLoading(true);
    try {
      const data = await notificationsApi.failedRecipients(notif.id);
      if (data.count === 0) {
        toast.error('No failed recipients on this campaign');
        return;
      }
      await copyText(data.userIds.join(','), `${data.count} failed user IDs`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendFailed = async () => {
    if (!notif) return;
    setActionLoading(true);
    try {
      const draft = await notificationsApi.resendToFailed(notif.id);
      toast.success('Retry draft created', {
        description: `Targeting ${draft.specificUserIds?.length ?? 0} failed recipients. Review and send when ready.`,
      });
      navigate(`/notifications/${draft.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create retry draft');
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

  const stats = deliveryStats ? toDeliveryStats(deliveryStats) : notif.stats;
  const emailStats = deliveryStats?.byPlatform?.email;
  const chartData = stats ? [
    { name: 'Sent', value: stats.delivered, color: 'hsl(142 71% 45%)' },
    { name: 'Failed', value: stats.failed, color: 'hsl(0 72% 51%)' },
    { name: 'Pending', value: stats.pending, color: 'hsl(213 94% 52%)' },
  ] : [];

  const canEdit = notif.status === 'draft' || notif.status === 'scheduled';
  const canSend = notif.status === 'draft';
  const canCancel = notif.status === 'scheduled' || notif.status === 'processing';
  const failedCount = emailStats?.failed ?? stats?.failed ?? 0;
  const canRetryFailed =
    notif.platforms.includes('email') &&
    failedCount > 0 &&
    ['completed', 'failed'].includes(notif.status);
  const showEmailColumn =
    logPlatform === 'email' ||
    logPlatform === 'all' ||
    notif.platforms.includes('email');

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${label}`);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
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
          {canRetryFailed && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyFailedIds}
                disabled={actionLoading}
                className="gap-2"
              >
                <Copy className="w-3.5 h-3.5" /> Copy failed IDs ({failedCount})
              </Button>
              <Button
                size="sm"
                onClick={handleResendFailed}
                disabled={actionLoading}
                className="gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Retry failed ({failedCount})
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={handleDuplicate} disabled={actionLoading} className="gap-2">
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </Button>
          <button onClick={() => load()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isPolling && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-status-processing/10 border border-status-processing/20 text-status-processing text-xs font-medium"
        >
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          Polling delivery stats every 3s until the campaign completes.
        </motion.div>
      )}

      <Tabs
        defaultValue="overview"
        onValueChange={(v) => {
          if (v === 'logs') {
            const defaultPlatform = notif.platforms.includes('email') ? 'email' : 'all';
            setLogPlatform(defaultPlatform);
            loadLogs(1, { platform: defaultPlatform });
          }
        }}
      >
        <TabsList className="mb-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Delivery Stats</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

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
                {notif.sentAt && (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Sent At</dt>
                    <dd className="text-sm text-foreground">{format(new Date(notif.sentAt), 'MMM d, yyyy HH:mm')}</dd>
                  </div>
                )}
              </dl>
            </div>

            {stats && (
              <>
                {[
                  { label: 'Total', value: stats.total, color: 'text-foreground' },
                  { label: 'Sent', value: stats.delivered, color: 'text-status-completed' },
                  { label: 'Failed', value: stats.failed, color: 'text-status-failed' },
                  { label: 'Pending', value: stats.pending, color: 'text-status-processing' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-4 text-center relative overflow-hidden">
                    {isPolling && label !== 'Total' && (
                      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-status-processing animate-pulse" />
                    )}
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide font-semibold">{label}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                    {stats.total > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">{((value / stats.total) * 100).toFixed(1)}%</p>
                    )}
                  </div>
                ))}
              </>
            )}

            {emailStats && notif.platforms.includes('email') && (
              <div className="bg-card border border-border rounded-xl p-5 col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Email delivery</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total', value: emailStats.total },
                    { label: 'Sent', value: emailStats.sent + emailStats.delivered },
                    { label: 'Failed', value: emailStats.failed },
                    { label: 'Queued', value: emailStats.queued },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-secondary/40 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
                      <p className="text-lg font-bold text-foreground">{value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>

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

                {deliveryStats && Object.keys(deliveryStats.byPlatform).length > 0 && (
                  <div className="mt-6 border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">By platform</p>
                    <div className="grid md:grid-cols-2 gap-3">
                      {(Object.entries(deliveryStats.byPlatform) as [Platform, typeof emailStats][]).map(([platform, pStats]) => {
                        if (!pStats) return null;
                        const sent = pStats.sent + pStats.delivered;
                        return (
                          <div key={platform} className="rounded-lg border border-border p-3">
                            <p className="text-sm font-semibold capitalize mb-2">{platformLabel[platform] ?? platform}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>Total <strong className="text-foreground">{pStats.total}</strong></span>
                              <span>Sent <strong className="text-status-completed">{sent}</strong></span>
                              <span>Failed <strong className="text-status-failed">{pStats.failed}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No delivery data yet. Send the notification to see stats.</p>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="logs">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[130px]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Platform</p>
                  <Select value={logPlatform} onValueChange={setLogPlatform}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All platforms</SelectItem>
                      {notif.platforms.map((p) => (
                        <SelectItem key={p} value={p}>{platformLabel[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[130px]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Status</p>
                  <Select value={logStatus} onValueChange={setLogStatus}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="min-w-[100px]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Per page</p>
                  <Select
                    value={String(logPageLimit)}
                    onValueChange={(v) => setLogPageLimit(Number(v))}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOG_PAGE_SIZES.map((n) => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[220px]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Search email or user ID</p>
                  <Input
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadLogs(1)}
                    placeholder="user@example.com"
                    className="h-9 text-xs"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => loadLogs(1)}
                  disabled={logsLoading}
                  className="h-9"
                >
                  {logsLoading ? 'Loading…' : 'Apply filters'}
                </Button>
              </div>

              {logSummary && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pt-4 border-t border-border text-xs">
                  <span>Matching: <strong>{logMeta.total.toLocaleString()}</strong></span>
                  <span className="text-status-completed">Sent: <strong>{(logSummary.sent + logSummary.delivered).toLocaleString()}</strong></span>
                  <span className="text-status-failed">Failed: <strong>{logSummary.failed.toLocaleString()}</strong></span>
                  <span className="text-status-processing">Queued: <strong>{logSummary.queued.toLocaleString()}</strong></span>
                  <span className="text-muted-foreground ml-auto">Click a row or <Eye className="w-3 h-3 inline -mt-0.5" /> to open full log details</span>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-secondary/90 backdrop-blur-sm">
                    <TableRow>
                      {showEmailColumn && <TableHead className="min-w-[220px]">Email</TableHead>}
                      <TableHead className="min-w-[200px]">User ID</TableHead>
                      <TableHead className="w-[100px]">Platform</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[150px]">Time</TableHead>
                      <TableHead className="min-w-[360px]">Details</TableHead>
                      <TableHead className="w-[52px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsLoading ? (
                      <TableRow>
                        <TableCell colSpan={showEmailColumn ? 7 : 6} className="h-32 text-center">
                          <div className="inline-block w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={showEmailColumn ? 7 : 6} className="h-32 text-center text-muted-foreground">
                          No delivery logs match these filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow
                          key={log.id}
                          className="align-top cursor-pointer hover:bg-secondary/30"
                          onClick={() => setSelectedLog(log)}
                        >
                          {showEmailColumn && (
                            <TableCell className="text-xs font-medium">
                              <button
                                type="button"
                                className="text-left hover:text-primary break-all"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (log.recipientEmail) copyText(log.recipientEmail, 'email');
                                }}
                              >
                                {log.recipientEmail ?? '—'}
                              </button>
                            </TableCell>
                          )}
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            <button
                              type="button"
                              className="hover:text-foreground text-left break-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyText(log.userId, 'user ID');
                              }}
                            >
                              {log.userId}
                            </button>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-xs capitalize">
                              <PlatformIcon platform={log.platform} className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              {platformLabel[log.platform]}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`text-xs font-semibold ${logStatusClass(log.status)}`}>
                              {formatLogStatus(log.status)}
                              {log.attempt && log.attempt > 1 ? ` · attempt ${log.attempt}` : ''}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatLogTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell className="text-xs min-w-[360px]">
                            {log.error ? (
                              <pre className="text-status-failed whitespace-pre-wrap break-words font-sans leading-relaxed m-0">
                                {log.error}
                              </pre>
                            ) : log.providerMessageId ? (
                              <span className="text-muted-foreground break-all">
                                Message ID: {log.providerMessageId}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                            {(log.errorCode || log.provider) && (
                              <p className="text-[11px] text-muted-foreground mt-1.5">
                                {log.provider ? `${log.provider}` : ''}
                                {log.provider && log.errorCode ? ' · ' : ''}
                                {log.errorCode ? `code ${log.errorCode}` : ''}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="p-1.5 rounded hover:bg-secondary text-muted-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              aria-label="View full log"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
              <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
                {selectedLog && (
                  <>
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
                      <DialogTitle className="text-base">Delivery log</DialogTitle>
                      <p className="text-xs text-muted-foreground font-mono break-all">{selectedLog.id}</p>
                    </DialogHeader>
                    <ScrollArea className="flex-1 max-h-[calc(90vh-8rem)]">
                      <div className="px-6 py-4 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <LogDetailField
                            label="Status"
                            value={`${formatLogStatus(selectedLog.status)}${selectedLog.attempt && selectedLog.attempt > 1 ? ` (attempt ${selectedLog.attempt})` : ''}`}
                          />
                          <LogDetailField label="Platform" value={platformLabel[selectedLog.platform] ?? selectedLog.platform} />
                          <LogDetailField label="Provider" value={selectedLog.provider} />
                          <LogDetailField label="Error code" value={selectedLog.errorCode} />
                          <LogDetailField
                            label="Email"
                            value={selectedLog.recipientEmail}
                            onCopy={selectedLog.recipientEmail ? () => copyText(selectedLog.recipientEmail!, 'email') : undefined}
                          />
                          <LogDetailField
                            label="User ID"
                            value={selectedLog.userId}
                            mono
                            onCopy={() => copyText(selectedLog.userId, 'user ID')}
                          />
                          <LogDetailField label="Logged at" value={formatLogTimestamp(selectedLog.timestamp)} />
                          <LogDetailField label="Sent at" value={formatLogTimestamp(selectedLog.sentAt)} />
                          <LogDetailField label="Delivered at" value={formatLogTimestamp(selectedLog.deliveredAt)} />
                          <LogDetailField label="Provider message ID" value={selectedLog.providerMessageId} mono />
                          <LogDetailField label="Batch ID" value={selectedLog.batchId} mono />
                        </div>

                        {selectedLog.error && (
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Full error</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1.5"
                                onClick={() => copyText(selectedLog.error!, 'error message')}
                              >
                                <Copy className="w-3 h-3" /> Copy error
                              </Button>
                            </div>
                            <pre className="text-xs text-status-failed whitespace-pre-wrap break-words font-mono leading-relaxed rounded-lg border border-border bg-secondary/30 p-3">
                              {selectedLog.error}
                            </pre>
                          </div>
                        )}

                        <div className="pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => copyText(JSON.stringify(selectedLog, null, 2), 'full log JSON')}
                          >
                            <Copy className="w-3 h-3" /> Copy full log JSON
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </>
                )}
              </DialogContent>
            </Dialog>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-xl px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing page <strong>{logMeta.page}</strong> of <strong>{logMeta.totalPages || 1}</strong>
                {' · '}
                <strong>{logMeta.total.toLocaleString()}</strong> total entries
                {' · '}
                <strong>{logPageLimit}</strong> per page
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logMeta.page <= 1 || logsLoading}
                  onClick={() => loadLogs(1)}
                  className="h-8 text-xs"
                >
                  First
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logMeta.page <= 1 || logsLoading}
                  onClick={() => loadLogs(logMeta.page - 1)}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </Button>
                <span className="text-xs font-medium px-2 min-w-[4rem] text-center">
                  {logMeta.page} / {logMeta.totalPages || 1}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logMeta.page >= (logMeta.totalPages || 1) || logsLoading}
                  onClick={() => loadLogs(logMeta.page + 1)}
                  className="h-8 gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={logMeta.page >= (logMeta.totalPages || 1) || logsLoading}
                  onClick={() => loadLogs(logMeta.totalPages || 1)}
                  className="h-8 text-xs"
                >
                  Last
                </Button>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
