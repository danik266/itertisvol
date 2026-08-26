'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type AccountType = 'volunteer' | 'user';

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  city: string;
  phone: string;
  dob: string;
  accountType?: AccountType;
  entityType?: 'individual' | 'legal';
  orgName?: string;
  activityType?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  socials?: Record<string, string>;
  directions?: string[];
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  phone: string;
  dob: string;
  accountType?: AccountType;
  entityType?: 'individual' | 'legal';
  orgName?: string;
  activityType?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  socials?: Record<string, string>;
  directions?: string[];
  generationCount?: number;
  isBlocked?: boolean;
  direction?: string;
  scores?: Record<string, number>;
  appliedEvents?: number[];
  generationHistory?: string[];
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (data: RegisterInput) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  clearError: () => void;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  register: async () => false,
  login: async () => false,
  logout: async () => {},
  updateUser: async () => {},
  clearError: () => {},
  setError: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const register = useCallback(
    async (data: RegisterInput): Promise<boolean> => {
      setError(null);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Ошибка регистрации');
          return false;
        }
        setUser(json.user);
        return true;
      } catch {
        setError('Ошибка сети');
        return false;
      }
    },
    []
  );

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Ошибка входа');
        return false;
      }
      setUser(json.user);
      return true;
    } catch {
      setError('Ошибка сети');
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      const res = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (res.ok && json.user) {
        setUser(json.user);
      }
    } catch {
      console.error('Failed to update user');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout, updateUser, clearError, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
