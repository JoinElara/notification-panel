import React, { createContext, useContext, useState, useCallback } from 'react';
import { setAuthToken } from '@/services/api';

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
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getAdminEmail = () =>
  (import.meta.env.VITE_ADMIN_EMAIL || 'admin@elara.style').trim().toLowerCase();

const getMockUser = (): AdminUser => {
  const email = getAdminEmail();
  return {
    id: 'admin-001',
    name: 'Admin User',
    email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}&backgroundColor=b6e3f4`,
    role: 'admin',
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const token = import.meta.env.VITE_ADMIN_TOKEN;
    if (token) setAuthToken(token);
    setUser(getMockUser());
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => {
    setAuthToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
