'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterCredentials } from '@padel/shared';
import { createAuthService, AuthService } from '@padel/shared';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage para web (localStorage)
const TOKEN_KEY = 'backend_jwt_token';
const USER_KEY = 'user_data';

const getToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

const setToken = async (token: string | null): Promise<void> => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// Crear servicio de auth usando proxy local
const authService = createAuthService({
  getToken,
  setToken,
  baseUrl: '/api', // Proxy local - las llamadas se redirigen al backend
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada al cargar
    const checkAuth = async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setTokenState(storedToken);
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Token inválido, limpiar
            await setToken(null);
            setTokenState(null);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const result = await authService.login(credentials);
      if (result.success && result.user && result.token) {
        setUser(result.user);
        setTokenState(result.token);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const result = await authService.register(credentials);
      return { success: result.success, message: result.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setTokenState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
