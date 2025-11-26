# 🔔 Implementación de Notificaciones - Pasos Finales

## ⚠️ IMPORTANTE
El archivo `AuthContext.tsx` se corrompió durante la edición. Necesitas revertirlo desde Git o hacerlo manualmente.

---

## 📋 Problema 1: Push Token No se Registra

### **Archivos Creados (Ya Listos)**
✅ `src/services/pushToken.service.ts` - Servicio para registrar token en backend

### **Archivos a Modificar**

#### **1. `src/features/auth/contexts/AuthContext.tsx`**

**Agregar import:**
```typescript
import { registerPushToken, unregisterPushToken } from '../../../services/pushToken.service';
```

**Modificar el listener de login (línea ~83):**
```typescript
const loginListener = DeviceEventEmitter.addListener('userLoggedIn', (data) => {
  console.log('🔵 Evento de login recibido, actualizando estado del AuthContext');
  
  const user: User = {
    uid: data.user.id,
    email: data.user.email,
    nombre: data.user.nombre,
    apellido: data.user.apellido || '',
    role: data.user.role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  setUser(user);
  setToken(data.token);
  setLoading(false);
  
  // ✅ AGREGAR ESTO:
  setTimeout(() => {
    registerPushToken().catch(err => 
      console.log('⚠️ Error registrando push token:', err)
    );
  }, 1000);
});
```

**Modificar loadUserFromStorage (línea ~128):**
```typescript
setUser(user);
setToken(savedToken);
console.log('✅ Usuario cargado exitosamente en AuthContext');

// ✅ AGREGAR ESTO:
setTimeout(() => {
  registerPushToken().catch(err => 
    console.log('⚠️ Error registrando push token:', err)
  );
}, 1000);
```

**Modificar logout (línea ~244):**
```typescript
const logout = async () => {
  try {
    // ✅ AGREGAR ESTO AL INICIO:
    await unregisterPushToken();
    
    await signOut(auth);
    setUser(null);
    setToken(null);
    await storage.removeItem(STORAGE_KEYS.USER);
    await storage.removeItem(STORAGE_KEYS.TOKEN);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};
```

---

## 📋 Problema 2: Navegación a Notificaciones No Existe

### **Crear Pantalla de Notificaciones**

#### **Archivo: `src/features/notifications/screens/NotificationsScreen.tsx`**

```typescript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../styles/colors';
import { spacing, fontSize, borderRadius } from '../../../styles/spacing';

interface Notification {
  id: string;
  type: 'nueva_reserva' | 'confirmation' | 'reminder' | 'cancellation';
  title: string;
  message: string;
  date: Date;
  read: boolean;
  data?: any;
}

const NotificationsScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    // TODO: Llamar al backend para obtener notificaciones
    // Por ahora, dejamos vacío
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'nueva_reserva':
        return 'calendar';
      case 'confirmation':
        return 'checkmark-circle';
      case 'reminder':
        return 'time';
      case 'cancellation':
        return 'close-circle';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'nueva_reserva':
        return '#3B82F6';
      case 'confirmation':
        return '#10B981';
      case 'reminder':
        return '#F59E0B';
      case 'cancellation':
        return '#EF4444';
      default:
        return colors.primary;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => {
        // Marcar como leída y navegar según tipo
        console.log('Notificación presionada:', item.id);
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${getIconColor(item.type)}20` }]}>
        <Ionicons name={getIconName(item.type)} size={24} color={getIconColor(item.type)} />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.date}>
          {item.date.toLocaleDateString()} {item.date.toLocaleTimeString()}
        </Text>
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <TouchableOpacity onPress={loadNotifications}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No hay notificaciones</Text>
          <Text style={styles.emptyMessage}>
            Cuando recibas notificaciones, aparecerán aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: 'bold',
    color: colors.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  message: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: colors.gray500,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 250,
  },
});

export default NotificationsScreen;
```

---

### **Registrar la Pantalla en la Navegación**

#### **Panel de Usuario**

**Archivo: `src/features/user/screens/CanchasScreen.tsx`**

Modificar la función `handleNotifications`:
```typescript
const handleNotifications = () => {
  console.log('Abriendo notificaciones...');
  navigation.navigate('Notifications'); // ✅ CAMBIAR ESTO
};
```

#### **Panel de Admin**

**Archivo: `src/features/admin/screens/AdminPerfilScreen.tsx`**

Modificar la función `handleNotifications`:
```typescript
const handleNotifications = () => {
  console.log('Navegando a notificaciones...');
  navigation.navigate('Notifications'); // ✅ CAMBIAR ESTO
};
```

---

### **Agregar Ruta en el Stack Navigator**

Necesitas agregar la pantalla en el navegador correspondiente. Busca donde están definidas las rutas (probablemente en `UserTabNavigator.tsx` o `AdminTabNavigator.tsx`) y agrega:

```typescript
import NotificationsScreen from '../notifications/screens/NotificationsScreen';

// Dentro del Stack.Navigator:
<Stack.Screen 
  name="Notifications" 
  component={NotificationsScreen}
  options={{ headerShown: false }}
/>
```

---

## 🧪 Probar

### **Test 1: Registro de Push Token**
1. Cierra sesión
2. Vuelve a iniciar sesión
3. Revisa los logs:
   ```
   ✅ Push token registrado exitosamente en el backend
   ```

### **Test 2: Backend Recibe el Token**
En el backend deberías ver:
```
✅ Push token registrado para usuario [userId]
```

### **Test 3: Admin Recibe Notificación**
1. Usuario normal hace una reserva
2. Admin debería recibir notificación push:
   ```
   🔔 Nueva Reserva Pendiente
   [Usuario] solicita reservar [Cancha] el [fecha] a las [hora]
   ```

### **Test 4: Navegación a Notificaciones**
1. Click en icono de campana
2. Debe navegar a pantalla de notificaciones
3. Por ahora aparecerá vacía (es normal)

---

## 📊 Resumen

| Item | Archivo | Acción |
|------|---------|--------|
| ✅ Servicio Push Token | `pushToken.service.ts` | Ya creado |
| ⚠️ AuthContext | `AuthContext.tsx` | Agregar 3 llamadas a registerPushToken |
| ⚠️ Pantalla Notificaciones | `NotificationsScreen.tsx` | Crear archivo |
| ⚠️ Navegación Usuario | `CanchasScreen.tsx` | Cambiar handleNotifications |
| ⚠️ Navegación Admin | `AdminPerfilScreen.tsx` | Cambiar handleNotifications |
| ⚠️ Registrar Ruta | `*TabNavigator.tsx` | Agregar NotificationsScreen |

---

## 🐛 Si no Funciona

### **Push Token no se registra**
- Verifica que `expo-notifications` esté instalado
- Revisa logs: `✅ Push token registrado`
- Verifica en backend: Query users con pushToken

### **Admin no recibe notificación**
- Verifica que el admin tenga pushToken en Firestore
- Verifica que `notificationsEnabled !== false`
- Revisa logs del backend al crear reserva

### **Navegación no funciona**
- Verifica que la ruta esté registrada en el Navigator
- El nombre debe ser exactamente 'Notifications'
- Verifica que el Navigator sea el correcto (User vs Admin)

---

¡Con esto deberían funcionar las notificaciones completamente! 🎉
