import { 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResponse, 
  GoogleLoginPayload,
  User 
} from '../types';
import { API_CONFIG, buildUrl, buildAuthHeaders } from '../config';

/**
 * Servicio de autenticación compartido (sin dependencias de plataforma)
 * Cada plataforma debe proporcionar el token storage
 */

export interface AuthServiceConfig {
  getToken: () => Promise<string | null>;
  setToken: (token: string | null) => Promise<void>;
  baseUrl?: string;
}

export const createAuthService = (config: AuthServiceConfig) => {
  const { getToken, setToken, baseUrl } = config;

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.auth.login, baseUrl),
        {
          method: 'POST',
          headers: API_CONFIG.defaultHeaders,
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Error al iniciar sesión' };
      }

      if (data.token) {
        await setToken(data.token);
      }

      return { success: true, token: data.token, user: data.user };
    } catch (error: any) {
      console.error('Error en login:', error);
      return { success: false, message: error.message };
    }
  };

  const register = async (userData: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.auth.register, baseUrl),
        {
          method: 'POST',
          headers: API_CONFIG.defaultHeaders,
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Error al registrar' };
      }

      return { success: true, user: data.user, token: data.token };
    } catch (error: any) {
      console.error('Error en register:', error);
      return { success: false, message: error.message };
    }
  };

  const loginWithGoogle = async (payload: GoogleLoginPayload): Promise<AuthResponse> => {
    try {
      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.auth.googleLogin, baseUrl),
        {
          method: 'POST',
          headers: API_CONFIG.defaultHeaders,
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Error con Google login' };
      }

      if (data.token) {
        await setToken(data.token);
      }

      return { success: true, token: data.token, user: data.user };
    } catch (error: any) {
      console.error('Error en Google login:', error);
      return { success: false, message: error.message };
    }
  };

  const logout = async (): Promise<void> => {
    await setToken(null);
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const token = await getToken();
      if (!token) return null;

      const response = await fetch(
        buildUrl(API_CONFIG.endpoints.auth.me, baseUrl),
        {
          headers: buildAuthHeaders(token),
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      return data.user || data;
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return null;
    }
  };

  return {
    login,
    register,
    loginWithGoogle,
    logout,
    getCurrentUser,
    getToken,
  };
};

export type AuthService = ReturnType<typeof createAuthService>;
