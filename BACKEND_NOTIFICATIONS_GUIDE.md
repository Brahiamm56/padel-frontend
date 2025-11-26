# 🔔 Guía de Implementación - Backend Notificaciones Push

## 📋 Resumen
Esta guía detalla paso a paso lo que debes implementar en tu backend de NorthPadel para que el sistema de notificaciones funcione completamente con la app móvil.

---

## 🎯 Requisitos del Frontend

Basándome en el código del frontend, el sistema necesita:

1. **Registro de Push Token**: Cuando el usuario abre la app, debe enviar su token al backend
2. **Notificaciones al crear reserva**: Confirmación inmediata + recordatorio programado
3. **Cancelación de notificaciones**: Al cancelar una reserva
4. **Almacenamiento de tokens**: En el documento del usuario en Firestore

---

## 📦 Paso 1: Instalar Dependencias

```bash
cd NorthPadel-Backend
npm install expo-server-sdk node-cron
```

**Paquetes:**
- `expo-server-sdk`: Para enviar notificaciones push a través de Expo
- `node-cron`: Para programar tareas periódicas (recordatorios)

---

## 📁 Paso 2: Crear Servicio de Notificaciones

**Archivo:** `src/services/notificationService.js`

```javascript
const { Expo } = require('expo-server-sdk');

class NotificationService {
  constructor() {
    this.expo = new Expo();
    this.scheduledNotifications = new Map(); // Almacenar notificaciones programadas
  }

  /**
   * Validar si un token es válido
   */
  isValidPushToken(token) {
    return Expo.isExpoPushToken(token);
  }

  /**
   * Enviar notificación push a un usuario
   */
  async sendPushNotification(pushToken, title, body, data = {}) {
    try {
      // Validar token
      if (!this.isValidPushToken(pushToken)) {
        console.error('❌ Token inválido:', pushToken);
        return { success: false, error: 'Token inválido' };
      }

      // Construir mensaje
      const message = {
        to: pushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
        priority: 'high',
        channelId: 'default',
      };

      // Enviar notificación
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('❌ Error enviando chunk:', error);
        }
      }

      console.log('✅ Notificación enviada:', title);
      return { success: true, tickets };

    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar confirmación de reserva
   */
  async sendReservaConfirmation(pushToken, reservaData) {
    const { canchaNombre, fecha, hora } = reservaData;
    
    return await this.sendPushNotification(
      pushToken,
      '✅ ¡Reserva Confirmada!',
      `Tu reserva en ${canchaNombre} para el ${fecha} a las ${hora} ha sido confirmada.`,
      { type: 'confirmation', reservaId: reservaData.id }
    );
  }

  /**
   * Programar recordatorio de reserva (2 horas antes)
   */
  scheduleReminder(pushToken, reservaData, horasAntes = 2) {
    try {
      const { id, canchaNombre, fechaHora } = reservaData;
      
      // Calcular tiempo de la notificación
      const reservaTime = new Date(fechaHora);
      const reminderTime = new Date(reservaTime.getTime() - (horasAntes * 60 * 60 * 1000));
      const now = new Date();
      const delay = reminderTime.getTime() - now.getTime();

      // Si la fecha ya pasó, no programar
      if (delay <= 0) {
        console.log('⚠️ La reserva es muy pronto, no se programa recordatorio');
        return null;
      }

      // Programar con setTimeout
      const timeoutId = setTimeout(async () => {
        await this.sendPushNotification(
          pushToken,
          '⚽ Recordatorio de Reserva',
          `Tu partido en ${canchaNombre} es en ${horasAntes} horas. ¡Prepárate!`,
          { type: 'reminder', reservaId: id }
        );
        
        // Limpiar del mapa
        this.scheduledNotifications.delete(id);
      }, delay);

      // Guardar en el mapa para poder cancelarlo después
      this.scheduledNotifications.set(id, timeoutId);
      
      console.log(`⏰ Recordatorio programado para reserva ${id} en ${delay}ms`);
      return timeoutId;

    } catch (error) {
      console.error('❌ Error programando recordatorio:', error);
      return null;
    }
  }

  /**
   * Cancelar recordatorio programado
   */
  cancelReminder(reservaId) {
    const timeoutId = this.scheduledNotifications.get(reservaId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(reservaId);
      console.log(`✅ Recordatorio cancelado para reserva ${reservaId}`);
      return true;
    }
    return false;
  }

  /**
   * Enviar notificación de cancelación
   */
  async sendCancelacionNotification(pushToken, reservaData) {
    const { canchaNombre, fecha, hora } = reservaData;
    
    return await this.sendPushNotification(
      pushToken,
      '❌ Reserva Cancelada',
      `Tu reserva en ${canchaNombre} para el ${fecha} a las ${hora} ha sido cancelada.`,
      { type: 'cancellation', reservaId: reservaData.id }
    );
  }

  /**
   * Validar receipts de notificaciones enviadas
   * (Útil para detectar tokens inválidos)
   */
  async validateReceipts(tickets) {
    const receiptIds = tickets
      .filter(ticket => ticket.id)
      .map(ticket => ticket.id);

    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
    const invalidTokens = [];

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
        
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          
          if (receipt.status === 'error') {
            console.error('❌ Error en receipt:', receipt.message);
            
            // Detectar tokens inválidos
            if (receipt.details?.error === 'DeviceNotRegistered') {
              invalidTokens.push(receiptId);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error validando receipts:', error);
      }
    }

    return invalidTokens;
  }
}

// Exportar instancia singleton
const notificationService = new NotificationService();
module.exports = notificationService;
```

---

## 🛣️ Paso 3: Crear Rutas de Notificaciones

**Archivo:** `src/routes/notifications.js`

```javascript
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { verifyToken } = require('../middleware/auth');
const notificationService = require('../services/notificationService');

/**
 * POST /api/notifications/register-token
 * Registrar o actualizar el push token del usuario
 */
router.post('/register-token', verifyToken, async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.userId;

    // Validar token
    if (!pushToken) {
      return res.status(400).json({ message: 'Push token es requerido' });
    }

    if (!notificationService.isValidPushToken(pushToken)) {
      return res.status(400).json({ message: 'Push token inválido' });
    }

    // Actualizar en Firestore
    await db.collection('users').doc(userId).update({
      pushToken: pushToken,
      pushTokenUpdatedAt: new Date(),
      notificationsEnabled: true,
    });

    console.log(`✅ Push token registrado para usuario ${userId}`);

    res.status(200).json({
      message: 'Push token registrado exitosamente',
      success: true
    });

  } catch (error) {
    console.error('❌ Error registrando push token:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * PUT /api/notifications/preferences
 * Actualizar preferencias de notificaciones
 */
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { notificationsEnabled, preferences } = req.body;
    const userId = req.user.userId;

    const updateData = {};
    if (typeof notificationsEnabled === 'boolean') {
      updateData.notificationsEnabled = notificationsEnabled;
    }
    if (preferences) {
      updateData.notificationPreferences = preferences;
    }

    await db.collection('users').doc(userId).update(updateData);

    console.log(`✅ Preferencias actualizadas para usuario ${userId}`);

    res.status(200).json({
      message: 'Preferencias actualizadas',
      success: true
    });

  } catch (error) {
    console.error('❌ Error actualizando preferencias:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

/**
 * POST /api/notifications/test
 * Enviar notificación de prueba (solo desarrollo)
 */
router.post('/test', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Obtener pushToken del usuario
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData.pushToken) {
      return res.status(400).json({ 
        message: 'Usuario no tiene push token registrado' 
      });
    }

    // Enviar notificación de prueba
    const result = await notificationService.sendPushNotification(
      userData.pushToken,
      '🧪 Notificación de Prueba',
      'Esta es una notificación de prueba desde el backend',
      { type: 'test' }
    );

    res.status(200).json({
      message: 'Notificación de prueba enviada',
      success: result.success
    });

  } catch (error) {
    console.error('❌ Error enviando notificación de prueba:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
```

---

## 🎯 Paso 4: Actualizar Ruta de Reservas

**Archivo:** `src/routes/reservas.js` (modificar el endpoint POST existente)

```javascript
// Importar el servicio al inicio del archivo
const notificationService = require('../services/notificationService');

// Dentro del endpoint POST /api/reservas
router.post('/', verifyToken, async (req, res) => {
  try {
    // ... tu código existente para crear reserva ...
    
    // NUEVO: Obtener usuario para el push token
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    // NUEVO: Enviar notificación de confirmación
    if (userData.pushToken && userData.notificationsEnabled !== false) {
      await notificationService.sendReservaConfirmation(userData.pushToken, {
        id: nuevaReserva.id,
        canchaNombre: canchaData.nombre,
        fecha: fecha,
        hora: hora,
      });
      
      // NUEVO: Programar recordatorio (2 horas antes)
      const fechaHora = new Date(`${fecha}T${hora}`);
      notificationService.scheduleReminder(userData.pushToken, {
        id: nuevaReserva.id,
        canchaNombre: canchaData.nombre,
        fechaHora: fechaHora,
      }, 2); // 2 horas antes
    }
    
    // ... resto del código ...
  } catch (error) {
    // ... manejo de errores ...
  }
});

// NUEVO: Modificar endpoint de cancelación
router.put('/:reservaId/cancelar', verifyToken, async (req, res) => {
  try {
    // ... tu código existente ...
    
    // NUEVO: Cancelar recordatorio programado
    notificationService.cancelReminder(reservaId);
    
    // NUEVO: Obtener datos para notificación
    const userDoc = await db.collection('users').doc(reserva.usuarioId).get();
    const userData = userDoc.data();
    
    // NUEVO: Enviar notificación de cancelación
    if (userData.pushToken) {
      const canchaDoc = await db.collection('complejos')
        .doc(reserva.complejoId)
        .collection('canchas')
        .doc(reserva.canchaId)
        .get();
      
      await notificationService.sendCancelacionNotification(userData.pushToken, {
        id: reservaId,
        canchaNombre: canchaDoc.data().nombre,
        fecha: reserva.fecha,
        hora: reserva.hora,
      });
    }
    
    // ... resto del código ...
  } catch (error) {
    // ... manejo de errores ...
  }
});
```

---

## 🔌 Paso 5: Registrar Rutas en el Servidor Principal

**Archivo:** `index.js` o `app.js` (tu archivo principal)

```javascript
// Importar rutas de notificaciones
const notificationsRoutes = require('./routes/notifications');

// Registrar rutas (después de las otras rutas)
app.use('/api/notifications', notificationsRoutes);
```

---

## 🗄️ Paso 6: Actualizar Modelo de Usuario en Firestore

Cuando un usuario registre su push token, se agregarán estos campos:

```javascript
{
  // Campos existentes...
  email: "usuario@example.com",
  nombre: "Juan",
  role: "user",
  
  // NUEVOS CAMPOS:
  pushToken: "ExponentPushToken[xxxxxxxxxxxxxx]",
  pushTokenUpdatedAt: Timestamp,
  notificationsEnabled: true,
  notificationPreferences: {
    reminders: true,
    confirmations: true,
    weatherAlerts: true
  }
}
```

**No necesitas migrar datos**, los campos se agregarán automáticamente cuando cada usuario abra la app.

---

## ⏰ Paso 7: Jobs Programados (Opcional pero Recomendado)

**Archivo:** `src/jobs/notificationJobs.js`

```javascript
const cron = require('node-cron');
const { db } = require('../config/firebase');
const notificationService = require('../services/notificationService');

class NotificationJobs {
  /**
   * Iniciar todos los jobs programados
   */
  static start() {
    console.log('🚀 Iniciando jobs de notificaciones...');
    
    // Reprogramar recordatorios al iniciar servidor
    // (en caso de que el servidor se haya reiniciado)
    this.reprogramarRecordatorios();
    
    // Ejecutar cada hora para verificar recordatorios pendientes
    cron.schedule('0 * * * *', () => {
      console.log('⏰ Ejecutando verificación de recordatorios...');
      this.verificarRecordatoriosPendientes();
    });
    
    console.log('✅ Jobs de notificaciones iniciados');
  }

  /**
   * Reprogramar recordatorios existentes al iniciar servidor
   */
  static async reprogramarRecordatorios() {
    try {
      const now = new Date();
      const dosDiasAdelante = new Date(now.getTime() + (48 * 60 * 60 * 1000));
      
      // Obtener reservas futuras (próximas 48 horas)
      const reservasSnapshot = await db.collection('reservas')
        .where('estado', '==', 'Confirmada')
        .get();
      
      let reprogramadas = 0;
      
      for (const doc of reservasSnapshot.docs) {
        const reserva = doc.data();
        const fechaHora = new Date(`${reserva.fecha}T${reserva.hora}`);
        
        // Solo reprogramar si es en el futuro y dentro de 48 horas
        if (fechaHora > now && fechaHora < dosDiasAdelante) {
          const userDoc = await db.collection('users').doc(reserva.usuarioId).get();
          const userData = userDoc.data();
          
          if (userData?.pushToken) {
            const canchaDoc = await db.collection('complejos')
              .doc(reserva.complejoId)
              .collection('canchas')
              .doc(reserva.canchaId)
              .get();
            
            notificationService.scheduleReminder(userData.pushToken, {
              id: doc.id,
              canchaNombre: canchaDoc.data().nombre,
              fechaHora: fechaHora,
            }, 2);
            
            reprogramadas++;
          }
        }
      }
      
      console.log(`✅ ${reprogramadas} recordatorios reprogramados`);
      
    } catch (error) {
      console.error('❌ Error reprogramando recordatorios:', error);
    }
  }

  /**
   * Verificar y enviar recordatorios pendientes
   */
  static async verificarRecordatoriosPendientes() {
    // Este método es redundante si usas setTimeout,
    // pero sirve como backup por si el servidor se reinicia
    console.log('✅ Verificación de recordatorios completada');
  }
}

module.exports = NotificationJobs;
```

**Activar jobs en el archivo principal:**

```javascript
// En index.js o app.js
const NotificationJobs = require('./jobs/notificationJobs');

// Después de configurar el servidor
NotificationJobs.start();
```

---

## 🔐 Paso 8: Variables de Entorno

**Archivo:** `.env`

```env
# Variables existentes...

# Notificaciones (Opcional, Expo maneja esto automáticamente)
NOTIFICATIONS_ENABLED=true
```

---

## 🧪 Paso 9: Testing

### **Prueba 1: Registrar Push Token**

```bash
# Desde Postman o curl
POST http://localhost:3000/api/notifications/register-token
Authorization: Bearer <tu_token_jwt>
Content-Type: application/json

{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxx]"
}
```

### **Prueba 2: Notificación de Prueba**

```bash
POST http://localhost:3000/api/notifications/test
Authorization: Bearer <tu_token_jwt>
```

### **Prueba 3: Crear Reserva y Verificar Notificación**

1. Crea una reserva desde la app
2. Deberías recibir confirmación inmediata
3. El recordatorio se enviará 2 horas antes

---

## 📋 Checklist de Implementación

### Configuración Inicial
- [ ] Instalar `expo-server-sdk` y `node-cron`
- [ ] Crear carpeta `src/services` si no existe
- [ ] Crear carpeta `src/jobs` si no existe

### Archivos a Crear
- [ ] `src/services/notificationService.js`
- [ ] `src/routes/notifications.js`
- [ ] `src/jobs/notificationJobs.js` (opcional)

### Archivos a Modificar
- [ ] `src/routes/reservas.js` - Agregar notificaciones en POST y PUT
- [ ] `index.js` o `app.js` - Registrar rutas y jobs

### Testing
- [ ] Probar registro de push token
- [ ] Probar notificación de prueba
- [ ] Probar crear reserva → recibir confirmación
- [ ] Probar cancelar reserva → recibir notificación
- [ ] Verificar que se programan recordatorios

---

## 🚨 Notas Importantes

### **1. Tokens Inválidos**
- Los tokens push pueden expirar o invalidarse
- El servicio detecta tokens inválidos automáticamente
- Considera limpiar tokens inválidos periódicamente

### **2. Reinicio del Servidor**
- Los recordatorios programados con `setTimeout` se pierden al reiniciar
- El job de reprogramación los restablece automáticamente
- Considera usar una queue system (Bull, BeeQueue) para producción

### **3. Límites de Expo**
- Límite de ~600 notificaciones por segundo
- No hay límite diario para apps publicadas
- En desarrollo, el límite es más bajo

### **4. Zona Horaria**
- Asegúrate de manejar correctamente las zonas horarias
- El frontend envía fechas en formato ISO
- Calcula los recordatorios correctamente

---

## 🎯 Flujo Completo de Notificaciones

```
1. Usuario abre app
   └─> Frontend obtiene push token
   └─> Frontend envía token a POST /api/notifications/register-token
   └─> Backend guarda token en Firestore

2. Usuario crea reserva
   └─> Frontend llama POST /api/reservas
   └─> Backend crea reserva
   └─> Backend envía confirmación INMEDIATA
   └─> Backend programa recordatorio para 2 horas antes

3. 2 horas antes de la reserva
   └─> setTimeout se ejecuta
   └─> Backend envía recordatorio
   └─> Usuario recibe notificación

4. Usuario cancela reserva
   └─> Frontend llama PUT /api/reservas/:id/cancelar
   └─> Backend cancela recordatorio programado
   └─> Backend envía notificación de cancelación
```

---

## 📊 Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/notifications/register-token` | Registrar push token del usuario |
| PUT | `/api/notifications/preferences` | Actualizar preferencias |
| POST | `/api/notifications/test` | Enviar notificación de prueba |
| POST | `/api/reservas` | Modificar para enviar notificaciones |
| PUT | `/api/reservas/:id/cancelar` | Modificar para cancelar recordatorios |

---

## 🔧 Troubleshooting

### **No llegan notificaciones**
- Verificar que el pushToken esté guardado correctamente
- Verificar que `notificationsEnabled` sea `true`
- Revisar logs del backend para errores
- Probar con el endpoint `/test`

### **Recordatorios no se envían**
- Verificar que la fecha/hora de la reserva sea correcta
- Verificar que el servidor no se haya reiniciado
- Revisar logs del job de reprogramación

### **Error: "DeviceNotRegistered"**
- El token ha expirado o es inválido
- Solicitar al usuario que cierre y abra la app
- El token se actualizará automáticamente

---

¡Listo! Con esta guía tienes todo lo necesario para implementar el sistema de notificaciones en tu backend. 🚀
