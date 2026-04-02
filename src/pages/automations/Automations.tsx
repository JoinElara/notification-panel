import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { automationApi } from '@/services/api';
import type { AutomationRule, AutomationDeliveryLogEntry } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, RefreshCw, Zap, Mail, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { TemplateListSkeleton } from '@/components/shared/Skeletons';

const LOG_PAGE_SIZE = 20;

export default function Automations() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationDeliveryLogEntry[]>([]);
  const [logsMeta, setLogsMeta] = useState({
    page: 1,
    limit: LOG_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [logFilters, setLogFilters] = useState({
    eventName: '',
    userId: '',
    status: '' as '' | 'sent' | 'failed' | 'skipped',
  });
  const logFiltersRef = useRef(logFilters);
  logFiltersRef.current = logFilters;

  const [form, setForm] = useState({
    eventName: '',
    templateName: '',
    channels: { email: true, push: false },
    titleFallback: '',
    bodyFallback: '',
    cooldownMinutes: '0',
    maxSendsPerUser: '',
    priority: '0',
  });

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await automationApi.listRules();
      setRules(data);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load automation rules');
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async (page = 1) => {
    const f = logFiltersRef.current;
    setLogsLoading(true);
    try {
      const res = await automationApi.deliveryLogs({
        page,
        limit: LOG_PAGE_SIZE,
        eventName: f.eventName || undefined,
        userId: f.userId || undefined,
        status: f.status || undefined,
      });
      setLogs(res.data);
      setLogsMeta({ ...res.meta, limit: LOG_PAGE_SIZE });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load delivery logs');
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  useEffect(() => {
    void loadLogs(1);
  }, [loadLogs]);

  const handleToggle = async (rule: AutomationRule) => {
    try {
      await automationApi.toggleRule(rule.id, !rule.enabled);
      toast.success(rule.enabled ? 'Rule disabled' : 'Rule enabled');
      loadRules();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Toggle failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await automationApi.deleteRule(id);
      toast.success('Rule deleted');
      loadRules();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const handleCreate = async () => {
    const channels: Array<'email' | 'push'> = [];
    if (form.channels.email) channels.push('email');
    if (form.channels.push) channels.push('push');
    if (channels.length === 0) {
      toast.error('Select at least one channel');
      return;
    }
    if (!form.eventName.trim() || !form.templateName.trim()) {
      toast.error('Event name and template name are required');
      return;
    }
    setCreating(true);
    try {
      await automationApi.createRule({
        eventName: form.eventName.trim(),
        templateName: form.templateName.trim(),
        channels,
        titleFallback: form.titleFallback || undefined,
        bodyFallback: form.bodyFallback || undefined,
        cooldownMinutes: Number.parseInt(form.cooldownMinutes, 10) || 0,
        maxSendsPerUser: form.maxSendsPerUser
          ? Number.parseInt(form.maxSendsPerUser, 10)
          : undefined,
        priority: Number.parseInt(form.priority, 10) || 0,
        enabled: true,
      });
      toast.success('Rule created');
      setCreateOpen(false);
      setForm({
        eventName: '',
        templateName: '',
        channels: { email: true, push: false },
        titleFallback: '',
        bodyFallback: '',
        cooldownMinutes: '0',
        maxSendsPerUser: '',
        priority: '0',
      });
      loadRules();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <TemplateListSkeleton />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Automations</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => { loadRules(); loadLogs(logsMeta.page); }} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Event-driven rules that send email and/or push using templates from <code className="text-xs bg-secondary px-1 rounded">email-templates</code>.
          These API routes are served by <strong className="text-foreground">Elara-Backend-v1</strong>. If requests fail,
          set <code className="text-xs bg-secondary px-1 rounded">VITE_API_URL</code> to your API base (e.g. <code className="text-xs bg-secondary px-1 rounded">/api/v2</code>) and point the dev proxy to that server.
        </p>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="logs">Delivery logs</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New rule
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <AnimatePresence>
              {rules.map((rule, i) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-card border rounded-lg p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground font-mono truncate">{rule.eventName}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Template: <span className="font-mono">{rule.templateName}</span> · priority {rule.priority}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">On</span>
                      <Switch checked={rule.enabled} onCheckedChange={() => handleToggle(rule)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {rule.channels.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground"
                      >
                        {c === 'email' ? <Mail className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                        {c}
                      </span>
                    ))}
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    Cooldown: {rule.cooldownMinutes} min
                    {rule.maxSendsPerUser != null ? ` · Max/user: ${rule.maxSendsPerUser}` : ''}
                  </p>

                  <div className="flex justify-end pt-1 border-t border-border">
                    <button
                      type="button"
                      onClick={() => handleDelete(rule.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {rules.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No automation rules yet. Create one or ensure the backend is reachable.</p>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <Label className="text-xs">Event</Label>
              <Input
                value={logFilters.eventName}
                onChange={(e) => setLogFilters((f) => ({ ...f, eventName: e.target.value }))}
                placeholder="e.g. user.registered"
                className="h-9 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <Label className="text-xs">User ID</Label>
              <Input
                value={logFilters.userId}
                onChange={(e) => setLogFilters((f) => ({ ...f, userId: e.target.value }))}
                placeholder="Mongo ObjectId"
                className="h-9 text-sm"
              />
            </div>
            <div className="w-36">
              <Label className="text-xs">Status</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={logFilters.status}
                onChange={(e) =>
                  setLogFilters((f) => ({
                    ...f,
                    status: e.target.value as typeof f.status,
                  }))
                }
              >
                <option value="">All</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={() => loadLogs(1)}>
              Apply
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Event</th>
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Channel</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Loading…
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No delivery logs yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                          {log.createdAt ? format(new Date(log.createdAt), 'MMM d, HH:mm:ss') : '—'}
                        </td>
                        <td className="p-3 font-mono text-xs max-w-[180px] truncate">{log.eventName}</td>
                        <td className="p-3 font-mono text-xs max-w-[120px] truncate">{log.userId}</td>
                        <td className="p-3 text-xs">{log.channel}</td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              log.status === 'sent'
                                ? 'bg-green-500/15 text-green-700 dark:text-green-400'
                                : log.status === 'failed'
                                  ? 'bg-destructive/15 text-destructive'
                                  : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground max-w-[240px] truncate" title={log.errorMessage}>
                          {log.errorMessage || log.templateName || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {logsMeta.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Page {logsMeta.page} of {logsMeta.totalPages} ({logsMeta.total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsMeta.page <= 1 || logsLoading}
                  onClick={() => loadLogs(logsMeta.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logsMeta.page >= logsMeta.totalPages || logsLoading}
                  onClick={() => loadLogs(logsMeta.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New automation rule</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div>
              <Label className="text-xs font-semibold">Event name</Label>
              <Input
                value={form.eventName}
                onChange={(e) => setForm((f) => ({ ...f, eventName: e.target.value }))}
                placeholder="e.g. user.registered"
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Template name</Label>
              <Input
                value={form.templateName}
                onChange={(e) => setForm((f) => ({ ...f, templateName: e.target.value }))}
                placeholder="e.g. welcome (matches 01-welcome.html)"
                className="mt-1 font-mono text-sm"
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.channels.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, channels: { ...f.channels, email: e.target.checked } }))
                  }
                />
                Email
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.channels.push}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, channels: { ...f.channels, push: e.target.checked } }))
                  }
                />
                Push
              </label>
            </div>
            <div>
              <Label className="text-xs font-semibold">Title fallback</Label>
              <Input
                value={form.titleFallback}
                onChange={(e) => setForm((f) => ({ ...f, titleFallback: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Body fallback</Label>
              <Textarea
                value={form.bodyFallback}
                onChange={(e) => setForm((f) => ({ ...f, bodyFallback: e.target.value }))}
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Cooldown (min)</Label>
                <Input
                  value={form.cooldownMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, cooldownMinutes: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Max per user</Label>
                <Input
                  value={form.maxSendsPerUser}
                  onChange={(e) => setForm((f) => ({ ...f, maxSendsPerUser: e.target.value }))}
                  placeholder="optional"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Priority</Label>
                <Input
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Saving…' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
