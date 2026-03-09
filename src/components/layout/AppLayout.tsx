import { useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { PageTransition } from '@/components/shared/PageTransition';
import { Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const crumbMap: Record<string, string> = {
  '/dashboard':     'Overview',
  '/notifications': 'Notifications',
  '/templates':     'Templates',
  '/segments':      'Segments',
  '/device-tokens': 'Device Tokens',
};

function getBreadcrumb(pathname: string) {
  if (pathname.includes('/notifications/create')) return 'New Notification';
  if (pathname.match(/\/notifications\/.+\/edit/)) return 'Edit Notification';
  if (pathname.match(/\/notifications\/.+/)) return 'Notification Detail';
  return crumbMap[pathname] ?? 'Dashboard';
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user } = useAuth();
  const title = getBreadcrumb(location.pathname);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />
              <div className="h-4 w-px bg-border mx-1" />
              <h1 className="text-sm font-semibold text-foreground tracking-tight">{title}</h1>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Dark mode toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDark
                    ? <Sun className="w-4 h-4 text-muted-foreground" />
                    : <Moon className="w-4 h-4 text-muted-foreground" />
                  }
                </button>
              )}

              {/* Bell */}
              <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-status-processing rounded-full" />
              </button>

              {/* Avatar */}
              <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-secondary transition-colors">
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="w-6 h-6 rounded-full bg-secondary flex-shrink-0"
                />
                <span className="text-xs font-medium text-foreground hidden sm:block max-w-[120px] truncate">
                  {user?.name}
                </span>
              </button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto scrollbar-thin">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
