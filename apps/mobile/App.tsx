import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/features/auth/contexts/AuthContext';
import { ThemeProvider } from './src/features/auth/contexts/ThemeContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { View, LogBox } from 'react-native';

// Suprimir warnings molestos conocidos
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'setLayoutAnimationEnabledExperimental',
  'SafeAreaView has been deprecated',
]);

// Suprimir errores de consola específicos de expo-notifications en Expo Go
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  const firstArg = args[0];
  if (
    typeof firstArg === 'string' &&
    (firstArg.includes('expo-notifications') ||
     firstArg.includes('functionality is not fully supported'))
  ) {
    return; // Ignorar estos errores
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  const firstArg = args[0];
  if (
    typeof firstArg === 'string' &&
    (firstArg.includes('expo-notifications') ||
     firstArg.includes('setLayoutAnimationEnabledExperimental') ||
     firstArg.includes('SafeAreaView has been deprecated'))
  ) {
    return; // Ignorar estos warnings
  }
  originalConsoleWarn(...args);
};

// Mantener el splash screen visible mientras se carga la app
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Aquí puedes cargar fuentes o hacer llamadas iniciales
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simular carga
      } catch (e) {
        console.warn(e);
      } finally {
        // Decirle a la aplicación que renderice
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Esto le dice al splash screen que se oculte
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <AppNavigator />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </View>
  );
}