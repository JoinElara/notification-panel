import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Plus, Trash2, RefreshCw, Copy, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppleIcon, AndroidIcon, WebIcon, PlatformIcon } from '@/components/shared/PlatformIcons';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { deviceTokensApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { getWebFcmToken, listenForForegroundMessages } from '@/services/firebaseMessaging';

interface DeviceTokenRecord {
  id: string;
  userId: string;
  platform: string;
  token: string;
  appVersion?: string;
  isActive: boolean;
  lastSeenAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function DeviceTokens() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<DeviceTokenRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [fetchingWebToken, setFetchingWebToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(user?.id || '');
  const [summary, setSummary] = useState<{ total: number; byPlatform: Array<{ _id: string; count: number }> }>({
    total: 0,
    byPlatform: [],
  });

  const [form, setForm] = useState({
    platform: 'web',
    token: '',
    appVersion: '1.0.0',
  });

  const canUnregister = useMemo(() => selectedUserId === user?.id, [selectedUserId, user?.id]);

  const loadStats = useCallback(async () => {
    try {
      const data = await deviceTokensApi.stats();
      setSummary(data);
    } catch (error: any) {
      toast.error('Failed to load token stats', { description: error?.message || 'Unknown error' });
    }
  }, []);

  const loadTokens = useCallback(async () => {
    if (!selectedUserId) {
      setTokens([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await deviceTokensApi.byUser(selectedUserId);
      const normalized = (data || []).map((item: any) => ({
        id: item.id || item._id,
        userId: item.userId,
        platform: item.platform,
        token: item.token,
        appVersion: item.appVersion,
        isActive: item.isActive,
        lastSeenAt: item.lastSeenAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
      setTokens(normalized);
    } catch (error: any) {
      toast.error('Failed to load user tokens', { description: error?.message || 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (user?.id && !selectedUserId) {
      setSelectedUserId(user.id);
    }
  }, [selectedUserId, user?.id]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  const handleRegister = async () => {
    if (!form.token || !form.appVersion) {
      toast.error('Token and app version are required');
      return;
    }

    if (!user?.id) {
      toast.error('No logged-in admin user found');
      return;
    }

    setRegistering(true);
    try {
      await deviceTokensApi.register({
        platform: form.platform as 'ios' | 'android' | 'web',
        token: form.token,
        appVersion: form.appVersion,
      });

      toast.success('Device token registered');
      setForm({ platform: 'web', token: '', appVersion: '1.0.0' });
      setShowForm(false);
      setSelectedUserId(user.id);
      await Promise.all([loadTokens(), loadStats()]);
    } catch (error: any) {
      toast.error('Failed to register token', { description: error?.message || 'Unknown error' });
    } finally {
      setRegistering(false);
    }
  };

  const handleFetchWebToken = async () => {
    setFetchingWebToken(true);
    try {
      const token = await getWebFcmToken();
      setForm((prev) => ({
        ...prev,
        platform: 'web',
        token,
      }));
      setShowForm(true);
      toast.success('Web FCM token generated', {
        description: 'Token has been added to the registration form.',
      });

      // Start listening for foreground notifications on this page
      listenForForegroundMessages((payload) => {
        toast.info(payload.title, { description: payload.body });
      });
    } catch (error: any) {
      toast.error('Failed to generate web token', {
        description: error?.message || 'Check Firebase config and browser permission.',
      });
    } finally {
      setFetchingWebToken(false);
    }
  };

  const handleUnregister = async (token: string) => {
    try {
      await deviceTokensApi.unregister(token);
      toast.success('Token unregistered');
      await Promise.all([loadTokens(), loadStats()]);
    } catch (error: any) {
      toast.error('Failed to unregister token', { description: error?.message || 'Unknown error' });
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Could not copy ${label.toLowerCase()}`);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Device Tokens</h2>
          <p className="text-sm text-muted-foreground">Register and inspect push tokens for notification delivery tests</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchWebToken}
            disabled={fetchingWebToken}
            className="gap-2"
          >
            {fetchingWebToken ? (
              <div className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
            ) : (
              <WebIcon className="w-4 h-4" />
            )}
            Get Web FCM Token
          </Button>
          <Button variant="outline" size="sm" onClick={() => Promise.all([loadTokens(), loadStats()])} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" /> Register Token
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 mb-5">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              To test web delivery, register a real browser FCM token for the same user you target in notification
              creation.
            </p>
            <p className="font-medium text-foreground">
              Logged-in admin user ID: {user?.id || 'n/a'}
              {user?.id && (
                <button
                  onClick={() => copyToClipboard(user.id, 'User ID')}
                  className="inline-flex items-center gap-1 ml-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-5">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Active tokens</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary.total}</p>
        </div>
        {(summary.byPlatform || []).map((item) => (
          <div key={item._id} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground capitalize">{item._id}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{item.count}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-card border border-border rounded-lg p-5 mb-5 overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Register token for logged-in admin user</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}>
                <SelectTrigger className="bg-background h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ios">
                    <span className="flex items-center gap-2"><AppleIcon className="w-3.5 h-3.5" /> iOS</span>
                  </SelectItem>
                  <SelectItem value="android">
                    <span className="flex items-center gap-2"><AndroidIcon className="w-3.5 h-3.5" /> Android</span>
                  </SelectItem>
                  <SelectItem value="web">
                    <span className="flex items-center gap-2"><WebIcon className="w-3.5 h-3.5" /> Web</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Device Token</Label>
              <Input
                value={form.token}
                onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
                placeholder="FCM token..."
                className="bg-background h-9 text-xs font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">App Version</Label>
              <Input
                value={form.appVersion}
                onChange={(e) => setForm((f) => ({ ...f, appVersion: e.target.value }))}
                placeholder="e.g. 1.0.0"
                className="bg-background h-9"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRegister} disabled={registering} className="gap-2">
              {registering ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Register
            </Button>
          </div>
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <Label className="text-xs font-semibold mb-1.5 block">View tokens for user ID</Label>
        <div className="flex gap-2">
          <Input
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            placeholder="Mongo user id"
            className="bg-background h-9"
          />
          <Button size="sm" onClick={loadTokens}>Load</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 px-5 py-2.5 border-b border-border bg-secondary/30">
          {['Platform', 'Token', 'App Version', 'Last Seen', ''].map((h) => (
            <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Loading tokens...</div>
        ) : tokens.length === 0 ? (
          <div className="text-center py-16">
            <Smartphone className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No active tokens for this user</p>
          </div>
        ) : (
          tokens.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="grid grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors items-center"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground"><PlatformIcon platform={t.platform} className="w-4 h-4" /></span>
                <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-status-completed' : 'bg-status-cancelled'}`} />
              </div>
              <div className="min-w-0 flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground truncate">{t.token}</span>
                <button
                  onClick={() => copyToClipboard(t.token, 'Token')}
                  className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-secondary"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <span className="text-xs text-foreground">{t.appVersion || 'n/a'}</span>
              <span className="text-xs text-muted-foreground">
                {t.lastSeenAt ? format(new Date(t.lastSeenAt), 'MMM d, yyyy HH:mm') : 'n/a'}
              </span>
              {canUnregister ? (
                <button
                  onClick={() => handleUnregister(t.token)}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  title="Unregister token"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[10px] text-muted-foreground">read-only</span>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
