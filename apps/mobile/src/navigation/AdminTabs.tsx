import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../styles/colors';
import { AdminCanchasScreen } from '../features/admin/screens/AdminCanchasScreen';
import AdminReservasScreen from '../features/admin/screens/AdminReservasScreen';
import AdminPerfilScreen from '../features/admin/screens/AdminPerfilScreen';
import NotificationsScreen from '../features/notifications/screens/NotificationsScreen';

type TabParamList = {
  Reservas: undefined;
  Canchas: undefined;
  PerfilTab: undefined;
};

type PerfilStackParamList = {
  Perfil: undefined;
  Notifications: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const PerfilStack = createNativeStackNavigator<PerfilStackParamList>();

// Stack Navigator para el perfil del admin
const PerfilStackNavigator = () => {
  return (
    <PerfilStack.Navigator screenOptions={{ headerShown: false }}>
      <PerfilStack.Screen name="Perfil" component={AdminPerfilScreen} />
      <PerfilStack.Screen name="Notifications" component={NotificationsScreen} />
    </PerfilStack.Navigator>
  );
};

export const AdminTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray500,
        tabBarStyle: {
          paddingTop: 5,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 5,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray200,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Reservas"
        component={AdminReservasScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="Canchas" 
        component={AdminCanchasScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="tennisball" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="PerfilTab" 
        component={PerfilStackNavigator}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AdminTabs;