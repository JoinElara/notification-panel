import { useLocation } from 'react-router-dom';
import { NavLink } from '@/components/NavLink';
import {
  LayoutDashboard,
  Bell,
  FileText,
  PieChart,
  Smartphone,
  Zap,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import elaraLogo from '@/assets/elara-logo.png';

const navItems = [
  { title: 'Overview',      url: '/dashboard',     icon: LayoutDashboard },
  { title: 'Notifications', url: '/notifications',  icon: Bell },
  { title: 'Templates',     url: '/templates',      icon: FileText },
  { title: 'Automations',   url: '/automations',    icon: Zap },
  { title: 'Segments',      url: '/segments',       icon: PieChart },
  { title: 'Device Tokens', url: '/device-tokens',  icon: Smartphone },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader className="px-3 py-3 border-b border-sidebar-border">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <img
            src={elaraLogo}
            alt="Elara"
            className="w-8 h-8 rounded-xl flex-shrink-0 object-cover"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm text-sidebar-foreground leading-tight tracking-tight">Elara</p>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight">Notifications</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2 pb-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.url ||
                  (item.url !== '/dashboard' && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                        }`}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User Footer */}
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center' : ''}`}>
          <img
            src={user?.avatar}
            alt={user?.name}
            className="w-7 h-7 rounded-full flex-shrink-0 bg-secondary ring-2 ring-border"
          />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-sidebar-foreground truncate leading-tight">{user?.name}</p>
                <p className="text-[10px] text-muted-foreground truncate leading-tight">{user?.email}</p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={signOut}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors flex-shrink-0"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">Sign out</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
