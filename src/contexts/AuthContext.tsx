import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { setAuthToken } from '@/services/api';
import { loginRequest, meRequest, type AuthUserDto } from '@/services/authApi';

const TOKEN_KEY = 'elara_notification_admin_token';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin';
}

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function toAdminUser(dto: AuthUserDto): AdminUser {
  return {
    id: dto.id,
    name: dto.name || dto.email.split('@')[0] || 'Admin',
    email: dto.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(dto.email)}&backgroundColor=b6e3f4`,
    role: 'admin',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem(TOKEN_KEY)?.trim();
      if (!token) {
        setIsLoading(false);
        return;
      }
      setAuthToken(token);
      try {
        const res = await meRequest();
        if (!cancelled && res?.user) {
          setUser(toAdminUser(res.user));
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setAuthToken(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginRequest(email.trim(), password);
      if (!res?.access_token) {
        throw new Error('No access token');
      }
      localStorage.setItem(TOKEN_KEY, res.access_token);
      setAuthToken(res.access_token);
      if (res.user) {
        setUser(toAdminUser(res.user));
      } else {
        const me = await meRequest();
        if (me?.user) setUser(toAdminUser(me.user));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
