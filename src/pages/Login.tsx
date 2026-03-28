import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, BarChart3, Target, Layers, LogIn } from 'lucide-react';
import elaraLogo from '@/assets/elara-logo.png';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const features = [
  { icon: Bell,       text: 'Multi-platform push & email',       sub: 'iOS, Android, Web, Email' },
  { icon: BarChart3,  text: 'Real-time delivery analytics',       sub: 'Track opens, clicks & failures' },
  { icon: Target,     text: 'Segment-based targeting',            sub: 'Reach the right audience' },
  { icon: Layers,     text: 'Reusable notification templates',    sub: 'Variables & rich content' },
];

export default function Login() {
  const { user, isLoading, signIn } = useAuth();
  const defaultEmail =
    (import.meta.env.VITE_ADMIN_EMAIL || 'admin@elara.style').trim();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Enter email and password');
      return;
    }
    try {
      await signIn(email, password);
      toast.success('Signed in');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed');
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-[52%] bg-primary flex-col justify-between p-12 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <img src={elaraLogo} alt="Elara" className="w-10 h-10 rounded-xl object-cover shadow-md" />
          <div>
            <p className="text-primary-foreground font-bold text-base tracking-tight leading-tight">Elara</p>
            <p className="text-primary-foreground/50 text-[10px] font-medium uppercase tracking-widest leading-tight">Notifications</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-primary-foreground leading-tight mb-4">
              Notification<br />management,<br />built for scale.
            </h2>
            <p className="text-primary-foreground/55 text-sm mb-10 leading-relaxed max-w-xs">
              Send targeted push notifications, emails, and in-app messages with full delivery analytics and template support.
            </p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {features.map(({ icon: Icon, text, sub }, i) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.08 }}
                className="flex items-center gap-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-primary-foreground/10 border border-primary-foreground/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/90 text-sm font-medium leading-tight">{text}</p>
                  <p className="text-primary-foreground/40 text-xs leading-tight">{sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-primary-foreground/25 text-xs relative">© 2026 Elara. All rights reserved.</p>
      </motion.div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="w-full max-w-[360px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <img src={elaraLogo} alt="Elara" className="w-9 h-9 rounded-xl object-cover shadow-sm" />
            <div>
              <p className="font-bold text-base text-foreground leading-tight">Elara</p>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest leading-tight">Notifications</p>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-1.5">Welcome back</h1>
            <p className="text-muted-foreground text-sm">
              Sign in as admin to access your notification dashboard
            </p>
            <p className="mt-2 text-xs text-muted-foreground/80">
              Use the admin account from backend-admin (see ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-card"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-card"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-95 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground text-center leading-relaxed">
            API: <span className="font-mono text-[11px]">VITE_API_URL</span> (default{' '}
            <span className="font-mono text-[11px]">/api</span> → Vite proxy to backend-admin)
          </p>

          <p className="text-center text-xs text-muted-foreground leading-relaxed">
            By signing in, you agree to our{' '}
            <span className="underline cursor-pointer hover:text-foreground transition-colors">Terms of Service</span>
            {' '}and{' '}
            <span className="underline cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
