import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = 'http://192.168.100.2:3000/api';
export const TOKEN_KEY = 'auth_token';

// ============================================
// SISTEMA DE MANEJO DE TOKEN EN MEMORIA
// ============================================
// Esto resuelve el problema de "race condition" donde
// las llamadas API intentan leer el token antes de que
// AsyncStorage termine de guardarlo.

let inMemoryToken: string | null = null;

/**
 * Establece el token en memoria inmediatamente.
 * Llamar después de un login exitoso.
 */
export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  console.log('🔑 Token establecido en memoria:', token ? 'Sí' : 'No');
};

/**
 * Obtiene el token actual (primero de memoria, luego de AsyncStorage).
 */
export const getAuthToken = async (): Promise<string | null> => {
  // Si hay token en memoria, usarlo inmediatamente
  if (inMemoryToken) {
    return inMemoryToken;
  }
  
  // Si no, intentar obtenerlo de AsyncStorage
  try {
    const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      inMemoryToken = storedToken; // Cachear para futuras llamadas
    }
    return storedToken;
  } catch (error) {
    console.error('Error obteniendo token:', error);
    return null;
  }
};

/**
 * Limpia el token de memoria (llamar en logout).
 */
export const clearAuthToken = () => {
  inMemoryToken = null;
  console.log('🔑 Token eliminado de memoria');
};

/**
 * Helper para hacer llamadas API autenticadas.
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
};