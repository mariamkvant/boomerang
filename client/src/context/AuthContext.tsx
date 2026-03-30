import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../api';

interface User { id: number; username: string; email: string; points: number; bio: string; avg_rating: number | null; review_count: number; email_verified: boolean; city: string | null; latitude: number | null; longitude: number | null; }
interface AuthCtx { user: User | null; login: (email: string, password: string) => Promise<void>; register: (username: string, email: string, password: string) => Promise<void>; logout: () => void; refreshUser: () => Promise<void>; }

const AuthContext = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    try { const u = await api.getMe(); setUser(u); } catch { setUser(null); localStorage.removeItem('token'); }
  };

  useEffect(() => { if (localStorage.getItem('token')) refreshUser(); }, []);

  const login = async (email: string, password: string) => {
    const { token, user: u } = await api.login({ email, password });
    localStorage.setItem('token', token);
    setUser(u);
  };

  const register = async (username: string, email: string, password: string) => {
    const { token, user: u } = await api.register({ username, email, password });
    localStorage.setItem('token', token);
    setUser(u);
  };

  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  return <AuthContext.Provider value={{ user, login, register, logout, refreshUser }}>{children}</AuthContext.Provider>;
}
