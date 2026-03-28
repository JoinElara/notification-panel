import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsApi } from '@/services/api';
import type { Notification, NotificationStatus } from '@/data/mockData';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlatformIcon } from '@/components/shared/PlatformIcons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NotificationListSkeleton } from '@/components/shared/Skeletons';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Plus, MoreHorizontal, Send, Copy, Pencil, Trash2, XCircle, RefreshCw,
  Link, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { NotificationsEmptyState } from '@/components/shared/NotificationsEmptyState';

const STATUSES: { value: string; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'draft',      label: 'Draft' },
  { value: 'scheduled',  label: 'Scheduled' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed',  label: 'Completed' },
  { value: 'failed',     label: 'Failed' },
  { value: 'cancelled',  label: 'Cancelled' },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export default function NotificationList() {
  const navigate = useNavigate();

  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [statusFilter, setStatusFilter]         = useState('all');
  const [search, setSearch]                     = useState('');
  const [actionLoading, setActionLoading]       = useState<string | null>(null);

  // Pagination
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await notificationsApi.list({ status: statusFilter, search });
    setAllNotifications(data);
    setPage(1);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  // Derived paginated slice
  const total      = allNotifications.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(page, totalPages);
  const start      = (safePage - 1) * pageSize;
  const notifications = allNotifications.slice(start, start + pageSize);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const handleSendNow = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await notificationsApi.sendNow(id);
      toast.success('Notification queued', { description: "It's now processing." });
      load();
    } finally { setActionLoading(null); }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await notificationsApi.duplicate(id);
      toast.success('Duplicated', { description: 'A draft copy has been created.' });
      load();
    } finally { setActionLoading(null); }
  };

  const handleCancel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await notificationsApi.cancel(id);
      toast.success('Cancelled');
      load();
    } finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(id);
    try {
      await notificationsApi.remove(id);
      toast.success('Deleted');
      load();
    } finally { setActionLoading(null); }
  };

  const canEdit   = (s: NotificationStatus) => s === 'draft' || s === 'scheduled';
  const canSend   = (s: NotificationStatus) => s === 'draft';
  const canCancel = (s: NotificationStatus) => s === 'scheduled' || s === 'processing';

  if (loading) return <NotificationListSkeleton />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">Manage all your push and email notifications</p>
        </div>
        <Button onClick={() => navigate('/notifications/create')} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Create
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-card"
          />
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                statusFilter === s.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={load} className="h-9 gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 border-b border-border bg-secondary/30">
          {['Notification', 'Platforms', 'Target', 'Status', ''].map((h) => (
            <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {notifications.length === 0 ? (
          <NotificationsEmptyState
            hasFilters={statusFilter !== 'all' || search.trim().length > 0}
            onClear={() => { setStatusFilter('all'); setSearch(''); }}
          />
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/notifications/${n.id}`)}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 border-b border-border hover:bg-secondary/40 cursor-pointer transition-colors last:border-0 ${actionLoading === n.id ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                    {n.link && <Link className="w-3 h-3 text-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{n.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(n.createdAt), 'MMM d, yyyy')}
                    {n.scheduledAt && (
                      <span className="ml-2 text-status-scheduled">
                        → {format(new Date(n.scheduledAt), 'MMM d, HH:mm')}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {n.platforms.map((p) => (
                    <span key={p} title={p} className="text-muted-foreground">
                      <PlatformIcon platform={p} className="w-3.5 h-3.5" />
                    </span>
                  ))}
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground capitalize">
                    {n.targetType === 'all_users' ? 'All users' :
                     n.targetType === 'specific_users' ? `${n.specificUserIds?.length ?? 0} users` : 'Segment'}
                  </span>
                </div>
                <div className="flex items-center">
                  <StatusBadge status={n.status} />
                </div>
                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {canSend(n.status) && (
                        <DropdownMenuItem onClick={(e) => handleSendNow(n.id, e)} className="gap-2">
                          <Send className="w-3.5 h-3.5" /> Send Now
                        </DropdownMenuItem>
                      )}
                      {canEdit(n.status) && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/notifications/${n.id}/edit`); }} className="gap-2">
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => handleDuplicate(n.id, e)} className="gap-2">
                        <Copy className="w-3.5 h-3.5" /> Duplicate
                      </DropdownMenuItem>
                      {canCancel(n.status) && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => handleCancel(n.id, e)} className="gap-2 text-status-scheduled">
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => handleDelete(n.id, e)} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination footer */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              Showing{' '}
              <span className="font-semibold text-foreground">{start + 1}–{Math.min(start + pageSize, total)}</span>
              {' '}of{' '}
              <span className="font-semibold text-foreground">{total}</span>
              {' '}notification{total !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Rows:</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
                <SelectTrigger className="h-7 w-16 text-xs bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => goTo(1)} disabled={safePage === 1} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronsLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => goTo(safePage - 1)} disabled={safePage === 1} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="w-7 h-7 flex items-center justify-center text-xs text-muted-foreground">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goTo(p as number)}
                    className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold transition-colors ${
                      safePage === p
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {p}
                  </button>
                )
              )
            }

            <button onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button onClick={() => goTo(totalPages)} disabled={safePage === totalPages} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronsRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
