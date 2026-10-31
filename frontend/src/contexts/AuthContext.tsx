import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, tenantName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? (JSON.parse(userStr) as User) : null;
    return {
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!(accessToken && user),
    };
  });

  const persistAuth = useCallback((user: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    setState({ user, accessToken, refreshToken, isAuthenticated: true });
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post('/api/identity/login', { email, password }) as LoginResponse;
    persistAuth(data.user, data.accessToken, data.refreshToken);
  }, [persistAuth]);

  const signup = useCallback(async (name: string, tenantName: string, email: string, password: string) => {
    const data = await api.post('/api/identity/signup', { name, tenantName, email, password }) as LoginResponse;
    persistAuth(data.user, data.accessToken, data.refreshToken);
  }, [persistAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/identity/logout');
    } catch {
      // Ignore logout errors
    }
    clearAuth();
  }, [clearAuth]);

  const refresh = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;
    const data = await api.post('/api/identity/refresh', { refreshToken }) as LoginResponse;
    persistAuth(data.user, data.accessToken, data.refreshToken);
  }, [persistAuth]);

  // Sync state if localStorage changes (multiple tabs)
  useEffect(() => {
    const handler = () => {
      const accessToken = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      if (!accessToken || !userStr) {
        setState(prev => ({ ...prev, isAuthenticated: false, user: null, accessToken: null }));
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
