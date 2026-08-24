import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { LoginPayload, RegisterPayload, User } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));

    const handleExpired = () => {
      setUser(null);
      setError('Tu sesión ha expirado. Inicia sesión nuevamente.');
    };
    window.addEventListener('playboss:session-expired', handleExpired);
    return () => window.removeEventListener('playboss:session-expired', handleExpired);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const loggedUser = await authService.login(payload);
      setUser(loggedUser);
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'No fue posible iniciar sesión.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await authService.register(payload);
      setUser(newUser);
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'No fue posible crear la cuenta.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{ user, authenticated: !!user, loading, error, login, register, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}
