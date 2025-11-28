import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { API_BASE_URL, TOKEN_KEY } from '../../../config/api';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential
} from 'firebase/auth';
import { auth } from '../../../config/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Completar la sesión de autenticación
WebBrowser.maybeCompleteAuthSession();

// --- URL de nuestro backend ---
const API_URL = `${API_BASE_URL}/auth`;
const USER_KEY = 'user_data';

// --- Tipos de Datos ---
export type Usuario = {
  id: string;
  email: string;
  nombre?: string;
  role: 'admin' | 'user';
};

// --- CONFIGURACIÓN DE GOOGLE AUTH ---
export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '91155734343-ees4tlh5b7j764e8ffrnkebp84n87aht.apps.googleusercontent.com',
    iosClientId: '91155734343-mitlcugvjboe64r7f91ms9s41qomkdl3.apps.googleusercontent.com',
    webClientId: '264292956767-09pabn7po7idvp1do7oa6a65qqsh2cbo.apps.googleusercontent.com', 
  });

  return { request, response, promptAsync };
};

// --- FUNCIÓN DE LOGIN CON GOOGLE ---
export const loginWithGoogle = async (idToken: string) => {
  try {
    console.log('🔵 [Google Login] Iniciando autenticación...');
    
    // 1. Autenticar con Firebase
    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const firebaseUser = userCredential.user;
    
    console.log('✅ [Google Login] Autenticado en Firebase:', firebaseUser.email);

    // 2. Enviar datos al backend
    console.log('🔵 [Google Login] Enviando datos al backend...');
    const response = await fetch(`${API_URL}/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: firebaseUser.email,
        nombre: firebaseUser.displayName,
        uid: firebaseUser.uid,
        photoURL: firebaseUser.photoURL
      }),
    });

    const data = await response.json();
    console.log('🔵 [Google Login] Respuesta del backend:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión con Google.');
    }

    // 3. Guardar token y datos del usuario
    if (data.token && data.user) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      console.log('✅ [Google Login] Token y usuario guardados');
      
      // Notificar al AuthContext
      DeviceEventEmitter.emit('userLoggedIn', {
        user: data.user,
        token: data.token
      });
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('🔴 [Google Login] Error:', error);
    return { success: false, message: error.message };
  }
};

// --- RESTO DE TUS FUNCIONES (registerUser, loginUser, logout, etc.) ---
// ... (mantén todo lo demás igual)

export const registerUser = async (userData: any) => {
  try {
    console.log('🔵 Enviando datos de registro a:', `${API_URL}/register`);
    
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    
    console.log('🔵 Respuesta del servidor:', response.status, response.statusText);
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('🔴 Respuesta no es JSON:', textResponse);
      throw new Error(`El servidor devolvió: ${textResponse}`);
    }
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Error al registrar el usuario.');
    }

    try {
      await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      console.log('✅ Usuario creado en Firebase');
    } catch (firebaseError) {
      console.error('🔴 Error al crear usuario en Firebase:', firebaseError);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("🔴 Error en registerUser:", error);
    return { success: false, message: error.message };
  }
};

export const loginUser = async (credentials: any) => {
    try {
        console.log('🔵 Enviando credenciales a:', `${API_URL}/login`);
        
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        
        const contentType = response.headers.get('content-type');
        
        if (!contentType || !contentType.includes('application/json')) {
            const textResponse = await response.text();
            console.error('🔴 Respuesta no es JSON:', textResponse);
            throw new Error(`El servidor devolvió: ${textResponse}`);
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión.');
        }

        if (data.token && data.user) {
            try {
                await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
                console.log('✅ Usuario autenticado en Firebase');
            } catch (firebaseError) {
                console.error('🔴 Error al autenticar en Firebase:', firebaseError);
            }

            await AsyncStorage.setItem(TOKEN_KEY, data.token);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
            console.log('✅ Token y datos de usuario guardados');
            
            DeviceEventEmitter.emit('userLoggedIn', {
                user: data.user,
                token: data.token
            });
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("🔴 Error en loginUser:", error);
        return { success: false, message: error.message };
    }
};

export const logout = async (): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    
    if (token) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
        });
        console.log('Sesión cerrada en el backend exitosamente');
      } catch (backendError) {
        console.warn('No se pudo cerrar sesión en el backend:', backendError);
      }
    }
    
    // Cerrar sesión en Firebase
    await auth.signOut();
    
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
    console.log('Sesión local cerrada exitosamente');
    
    DeviceEventEmitter.emit('userLoggedOut');
    
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
};

export const getToken = async (): Promise<string | null> => {
    return await AsyncStorage.getItem(TOKEN_KEY);
};

export const getSavedUser = async (): Promise<Usuario | null> => {
    const userJson = await AsyncStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
};