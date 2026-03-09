import { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppleIcon, AndroidIcon, WebIcon, PlatformIcon } from '@/components/shared/PlatformIcons';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DeviceToken {
  id: string;
  platform: string;
  token: string;
  appVersion: string;
  registeredAt: string;
  isActive: boolean;
}

const MOCK_TOKENS: DeviceToken[] = [
  { id: '1', platform: 'ios',     token: 'tkn_abc123xyz...', appVersion: '2.1.0', registeredAt: '2026-03-01T10:00:00Z', isActive: true },
  { id: '2', platform: 'android', token: 'tkn_def456uvw...', appVersion: '2.0.5', registeredAt: '2026-03-02T11:00:00Z', isActive: true },
  { id: '3', platform: 'web',     token: 'tkn_ghi789rst...', appVersion: '1.0.0', registeredAt: '2026-02-28T09:00:00Z', isActive: false },
];

// platform icons handled via PlatformIcon component

export default function DeviceTokens() {
  const [tokens, setTokens]       = useState<DeviceToken[]>(MOCK_TOKENS);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ platform: 'ios', token: '', appVersion: '' });
  const [registering, setRegistering] = useState(false);

  const handleRegister = async () => {
    if (!form.token || !form.appVersion) {
      toast.error('All fields required');
      return;
    }
    setRegistering(true);
    await new Promise((r) => setTimeout(r, 800));
    const newToken: DeviceToken = {
      id: Date.now().toString(),
      platform: form.platform,
      token: form.token,
      appVersion: form.appVersion,
      registeredAt: new Date().toISOString(),
      isActive: true,
    };
    setTokens((prev) => [newToken, ...prev]);
    setForm({ platform: 'ios', token: '', appVersion: '' });
    setShowForm(false);
    setRegistering(false);
    toast.success('Device token registered');
  };

  const handleUnregister = async (id: string) => {
    await new Promise((r) => setTimeout(r, 500));
    setTokens((prev) => prev.filter((t) => t.id !== id));
    toast.success('Token unregistered');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Device Tokens</h2>
          <p className="text-sm text-muted-foreground">Manage push notification device tokens</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Register Token
        </Button>
      </div>

      {/* Register Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-lg p-5 mb-5 overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Register New Device Token</h3>
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
              <Input value={form.token} onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))} placeholder="FCM/APNs token..." className="bg-background h-9 text-xs font-mono" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">App Version</Label>
              <Input value={form.appVersion} onChange={(e) => setForm((f) => ({ ...f, appVersion: e.target.value }))} placeholder="e.g. 2.1.0" className="bg-background h-9" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRegister} disabled={registering} className="gap-2">
              {registering ? <div className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Register
            </Button>
          </div>
        </motion.div>
      )}

      {/* Tokens Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 px-5 py-2.5 border-b border-border bg-secondary/30">
          {['Platform', 'Token', 'App Version', 'Registered', ''].map((h) => (
            <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</span>
          ))}
        </div>
        {tokens.length === 0 ? (
          <div className="text-center py-16">
            <Smartphone className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No device tokens registered</p>
          </div>
        ) : (
          tokens.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="grid grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors items-center"
            >
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground"><PlatformIcon platform={t.platform} className="w-4 h-4" /></span>
                <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-status-completed' : 'bg-status-cancelled'}`} />
              </div>
              <span className="text-xs font-mono text-muted-foreground truncate">{t.token}</span>
              <span className="text-xs text-foreground">{t.appVersion}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(t.registeredAt), 'MMM d, yyyy')}</span>
              <button
                onClick={() => handleUnregister(t.id)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
