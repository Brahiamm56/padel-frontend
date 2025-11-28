// Firebase config compartida (sin inicialización específica de plataforma)
// IMPORTANTE: En producción, usar variables de entorno

// Función helper para obtener variables de entorno
const getEnvVar = (webKey: string, mobileKey: string, defaultValue: string = ''): string => {
  // Web (Next.js)
  if (typeof process !== 'undefined' && process.env) {
    const webValue = process.env[webKey];
    if (webValue) return webValue;
  }
  
  // Mobile (Expo) - las variables se inyectan en build time
  if (typeof process !== 'undefined' && process.env) {
    const mobileValue = process.env[mobileKey];
    if (mobileValue) return mobileValue;
  }
  
  return defaultValue;
};

// Configuración de Firebase usando variables de entorno
export const firebaseConfig = {
  apiKey: getEnvVar('NEXT_PUBLIC_FIREBASE_API_KEY', 'EXPO_PUBLIC_FIREBASE_API_KEY', ''),
  authDomain: getEnvVar('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN', ''),
  projectId: getEnvVar('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID', ''),
  storageBucket: getEnvVar('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET', ''),
  messagingSenderId: getEnvVar('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', ''),
  appId: getEnvVar('NEXT_PUBLIC_FIREBASE_APP_ID', 'EXPO_PUBLIC_FIREBASE_APP_ID', ''),
  measurementId: getEnvVar('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', 'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID', ''),
};

// Google OAuth Client IDs usando variables de entorno
export const googleAuthConfig = {
  androidClientId: getEnvVar('NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', ''),
  iosClientId: getEnvVar('NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', ''),
  webClientId: getEnvVar('NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID', 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', ''),
};

// Validar que las configuraciones estén presentes
export const isFirebaseConfigured = (): boolean => {
  return !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
};

export const isGoogleAuthConfigured = (): boolean => {
  return !!(googleAuthConfig.webClientId);
};
