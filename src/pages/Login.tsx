import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, BarChart3, Target, Layers } from 'lucide-react';
import elaraLogo from '@/assets/elara-logo.png';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
      </g>
    </svg>
  );
}

const features = [
  { icon: Bell,       text: 'Multi-platform push & email',       sub: 'iOS, Android, Web, Email' },
  { icon: BarChart3,  text: 'Real-time delivery analytics',       sub: 'Track opens, clicks & failures' },
  { icon: Target,     text: 'Segment-based targeting',            sub: 'Reach the right audience' },
  { icon: Layers,     text: 'Reusable notification templates',    sub: 'Variables & rich content' },
];

export default function Login() {
  const { user, isLoading, signInWithGoogle } = useAuth();
  const [clicked, setClicked] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSignIn = async () => {
    setClicked(true);
    await signInWithGoogle();
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
            <p className="text-muted-foreground text-sm">Sign in to access your notification dashboard</p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={isLoading || clicked}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-card border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-secondary transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.99]"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {isLoading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">
                Demo mode — no real OAuth required
              </span>
            </div>
          </div>

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
