import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, TOKEN_KEY } from '../config/api';
import { getPushToken, requestNotificationPermissions } from './notifications.service';

const API_URL = API_BASE_URL;

/**
 * Registrar el push token del usuario en el backend
 */
export const registerPushToken = async (): Promise<boolean> => {
  try {
    // Solicitar permisos
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('⚠️ No hay permisos para notificaciones');
      return false;
    }

    // Obtener token
    const pushToken = await getPushToken();
    if (!pushToken) {
      console.log('⚠️ No se pudo obtener push token');
      return false;
    }

    // Verificar si ya se registró este token
    const lastToken = await AsyncStorage.getItem('last_push_token');
    if (lastToken === pushToken) {
      console.log('✅ Push token ya está registrado');
      return true;
    }

    // Enviar al backend
    const authToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (!authToken) {
      console.log('⚠️ No hay token de autenticación');
      return false;
    }

    // Obtener userId del usuario guardado
    const userDataJson = await AsyncStorage.getItem('user_data');
    if (!userDataJson) {
      console.log('⚠️ No hay datos de usuario guardados');
      return false;
    }
    const userData = JSON.parse(userDataJson);
    const userId = userData.id || userData.uid;

    const response = await fetch(`${API_URL}/notifications/register-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pushToken, userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Si el token está expirado, solo loguear en desarrollo
      if (errorText.includes('Token no válido') || errorText.includes('expirado')) {
        console.log('⚠️ Token de autenticación expirado. Necesita volver a iniciar sesión.');
        return false;
      }
      
      console.error('❌ Error registrando push token:', errorText);
      return false;
    }

    // Guardar localmente para no enviar múltiples veces
    await AsyncStorage.setItem('last_push_token', pushToken);
    console.log('✅ Push token registrado exitosamente en el backend');
    
    return true;
  } catch (error: any) {
    // Solo loguear en modo desarrollo, sin stack trace completo
    if (__DEV__) {
      console.log('⚠️ Error en registerPushToken:', error.message || error);
    }
    return false;
  }
};

/**
 * Desregistrar el push token (al cerrar sesión)
 */
export const unregisterPushToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('last_push_token');
    console.log('✅ Push token desregistrado localmente');
  } catch (error) {
    console.error('❌ Error desregistrando push token:', error);
  }
};
