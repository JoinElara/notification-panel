import React, { createContext, useContext, useState, useCallback } from 'react';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin';
}

interface AuthContextType {
  user: MockUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USER: MockUser = {
  id: 'admin-001',
  name: 'Harpreet Singh',
  email: 'harpreet@elara.app',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=harpreet&backgroundColor=b6e3f4',
  role: 'admin',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    // Simulate OAuth flow delay
    await new Promise((r) => setTimeout(r, 1500));
    setUser(MOCK_USER);
    setIsLoading(false);
  }, []);

  const signOut = useCallback(() => {
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
