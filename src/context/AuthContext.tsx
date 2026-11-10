import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { CompleteProfilePayload, LoginPayload, RegisterPayload, User } from '@/types';
import { authService } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  /** Devuelve true si el perfil quedó incompleto (debe completarlo antes de apostar/depositar). */
  loginWithGoogle: (credential: string) => Promise<boolean>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: User) => void;
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

  // NOTA: "loading" aquí representa únicamente "verificando si hay sesión
  // activa" (usado por ProtectedRoute/PublicOnlyRoute para decidir si
  // renderizar). login()/register() NO deben tocarlo: cada formulario ya
  // maneja su propio estado de carga local para el botón. Si se reutilizara
  // "loading" también aquí, PublicOnlyRoute desmontaría el formulario de
  // login/registro apenas se dispara la petición (porque loading pasa a
  // true) y lo volvería a montar de cero al terminar, perdiendo el mensaje
  // de error y los valores del formulario.
  const login = useCallback(async (payload: LoginPayload) => {
    setError(null);
    try {
      const loggedUser = await authService.login(payload);
      setUser(loggedUser);
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'No fue posible iniciar sesión.';
      setError(message);
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    setError(null);
    try {
      const newUser = await authService.register(payload);
      setUser(newUser);
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'No fue posible crear la cuenta.';
      setError(message);
      throw err;
    }
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    setError(null);
    try {
      const result = await authService.loginWithGoogle(credential);
      setUser(result.user);
      return result.profileIncomplete;
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'No fue posible iniciar sesión con Google.';
      setError(message);
      throw err;
    }
  }, []);

  const completeProfile = useCallback(async (payload: CompleteProfilePayload) => {
    setUser(await authService.completeGoogleProfile(payload));
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const updateUser = useCallback((next: User) => setUser(next), []);

  return (
    <AuthContext.Provider
      value={{ user, authenticated: !!user, loading, error, login, register, loginWithGoogle, completeProfile, logout, clearError, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
