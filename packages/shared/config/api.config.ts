// Configuración de API compartida
// Todas las URLs sensibles se manejan via variables de entorno

// Detectar si estamos en el navegador
const isBrowser = typeof window !== 'undefined';

// Función helper para obtener variables de entorno
const getEnvVar = (webKey: string, mobileKey: string, defaultValue: string = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[webKey] || process.env[mobileKey] || defaultValue;
  }
  return defaultValue;
};

export const API_CONFIG = {
  // En web usa proxy (/api), en mobile usa la URL de las variables de entorno
  baseUrl: isBrowser 
    ? '/api'  // Proxy local en Next.js - seguro, no expone URLs
    : getEnvVar('NEXT_PUBLIC_API_URL', 'EXPO_PUBLIC_API_URL', '/api'),
  
  // Endpoints (relativos al baseUrl)
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      googleLogin: '/auth/google-login',
      logout: '/auth/logout',
      me: '/auth/me',
    },
    reservas: {
      list: '/reservas',
      create: '/reservas',
      cancel: (id: string) => `/reservas/${id}/cancelar`,
      detail: (id: string) => `/reservas/${id}`,
    },
    canchas: {
      list: '/canchas',
      detail: (complejoId: string, canchaId: string) => `/canchas/${complejoId}/${canchaId}`,
    },
    admin: {
      reservas: '/admin/reservas',
      cancelarReserva: (id: string) => `/admin/reservas/${id}/cancelar`,
      confirmarReserva: (id: string) => `/admin/reservas/${id}/confirmar`,
    },
    user: {
      profile: '/users/profile',
      updateProfile: '/users/profile',
    },
  },
  
  // Headers por defecto
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
};

// Función para construir URL completa
export const buildUrl = (endpoint: string, baseUrl?: string): string => {
  const base = baseUrl || API_CONFIG.baseUrl;
  return `${base}${endpoint}`;
};

// Función para construir headers con autenticación
export const buildAuthHeaders = (token: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    ...API_CONFIG.defaultHeaders,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};
