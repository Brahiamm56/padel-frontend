/**
 * Servicio de Notificaciones Push
 * 
 * Funcionalidades:
 * - Solicitar permisos de notificaciones
 * - Programar notificaciones locales
 * - Manejar notificaciones push
 * 
 * NOTA: Para que funcione completamente, necesitas:
 * 1. Instalar: expo install expo-notifications expo-device expo-constants
 * 2. Configurar las credenciales en app.json
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Solicitar permisos de notificaciones
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Permisos de notificaciones denegados');
        return false;
      }
      
      console.log('✅ Permisos de notificaciones otorgados');
      
      // Configurar canal de notificaciones para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#C4D600',
        });
      }
      
      return true;
    } else {
      console.log('⚠️ Las notificaciones push solo funcionan en dispositivos físicos');
      return false;
    }
  } catch (error) {
    console.error('Error solicitando permisos:', error);
    return false;
  }
};

/**
 * Programar notificación de recordatorio para una reserva
 * Se programa 2 horas antes de la hora de la reserva
 */
export const scheduleReservaReminder = async (
  reservaId: string,
  canchaNombre: string,
  fechaHora: Date,
  horasAntes: number = 2
): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('⚠️ No hay permisos para programar notificación');
      return null;
    }
    
    // Calcular el tiempo de la notificación (X horas antes)
    const notificationTime = new Date(fechaHora);
    notificationTime.setHours(notificationTime.getHours() - horasAntes);
    
    // Si la fecha es en el pasado, no programar
    if (notificationTime < new Date()) {
      console.log('⚠️ La fecha de notificación es en el pasado');
      return null;
    }
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚽ Recordatorio de Reserva',
        body: `Tu partido en ${canchaNombre} es en ${horasAntes} horas. ¡Prepárate!`,
        data: { reservaId, type: 'reminder' },
        sound: true,
      },
      trigger: notificationTime as any,
    });
    
    console.log(`✅ Notificación programada: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error programando notificación:', error);
    return null;
  }
};

/**
 * Programar notificación de confirmación de reserva
 */
export const scheduleReservaConfirmation = async (
  canchaNombre: string,
  fecha: string,
  hora: string
): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '✅ ¡Reserva Confirmada!',
        body: `Tu reserva en ${canchaNombre} para el ${fecha} a las ${hora} ha sido confirmada.`,
        data: { type: 'confirmation' },
        sound: true,
      },
      trigger: null, // Mostrar inmediatamente
    });
    
    console.log(`✅ Notificación de confirmación enviada: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error enviando notificación de confirmación:', error);
    return null;
  }
};

/**
 * Programar notificación de cambio de clima
 */
export const scheduleWeatherAlert = async (
  canchaNombre: string,
  fecha: string,
  condicionClima: string
): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌧️ Alerta de Clima',
        body: `Se pronostica ${condicionClima} para tu partido en ${canchaNombre} el ${fecha}.`,
        data: { type: 'weather' },
        sound: true,
      },
      trigger: null, // Mostrar inmediatamente
    });
    
    console.log(`✅ Alerta de clima enviada: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error enviando alerta de clima:', error);
    return null;
  }
};

/**
 * Cancelar una notificación programada
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`✅ Notificación cancelada: ${notificationId}`);
  } catch (error) {
    console.error('Error cancelando notificación:', error);
  }
};

/**
 * Cancelar todas las notificaciones programadas
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Todas las notificaciones canceladas');
  } catch (error) {
    console.error('Error cancelando notificaciones:', error);
  }
};

/**
 * Obtener token de push notifications (para backend)
 */
export const getPushToken = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('⚠️ Los tokens de push solo funcionan en dispositivos físicos');
      return null;
    }
    
    // Intentar obtener token con projectId desde app.json
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('📱 Push token:', token.data);
      return token.data;
    } catch (tokenError: any) {
      // Si falla por falta de projectId, usar un token simulado para desarrollo
      if (tokenError.message?.includes('projectId')) {
        console.log('⚠️ Usando token simulado para desarrollo (Expo Go)');
        const simulatedToken = `ExpoToken[${Device.deviceName}-${Date.now()}]`;
        return simulatedToken;
      }
      throw tokenError;
    }
  } catch (error) {
    console.error('Error obteniendo push token:', error);
    return null;
  }
};
