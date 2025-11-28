# 🔧 Guía de Configuración - Padel Frontend

Esta guía explica cómo configurar el frontend para conectarse con el backend de forma segura.

## 📋 Requisitos Previos

- Node.js 18+ instalado
- Backend de Padel corriendo (ver sección Backend)
- Proyecto Firebase configurado
- (Opcional) Cuenta de Google Cloud para OAuth

---

## 🏗️ Estructura del Proyecto

```
padel-frontend/
├── apps/
│   ├── mobile/          # App React Native/Expo
│   │   └── .env         # Variables de entorno mobile
│   └── web/             # App Next.js
│       └── .env.local   # Variables de entorno web
├── packages/
│   └── shared/          # Código compartido
└── .gitignore           # Ignora archivos .env
```

---

## 🔐 Configuración de Variables de Entorno

### ⚠️ IMPORTANTE: Seguridad

- **NUNCA** subas archivos `.env` o `.env.local` a Git
- Los archivos `.env.example` son plantillas seguras para compartir
- El `.gitignore` ya está configurado para ignorar estos archivos

---

## 🌐 Configuración Web (Next.js)

### 1. Crear archivo de entorno

```bash
cd apps/web
cp .env.example .env.local
```

### 2. Editar `.env.local`

```env
# ============================================
# BACKEND API (REQUERIDO)
# ============================================
# URL del servidor backend SIN /api al final
# El proxy de Next.js añade /api automáticamente
BACKEND_URL=http://localhost:3000

# Para producción:
# BACKEND_URL=https://api.tudominio.com

# ============================================
# FIREBASE (REQUERIDO)
# ============================================
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX

# ============================================
# GOOGLE OAUTH (OPCIONAL)
# ============================================
NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-client-id.apps.googleusercontent.com
```

### 3. Iniciar el servidor

```bash
npm run dev
```

La app estará en: http://localhost:3000

---

## 📱 Configuración Mobile (Expo)

### 1. Crear archivo de entorno

```bash
cd apps/mobile
cp .env.example .env
```

### 2. Editar `.env`

```env
# ============================================
# BACKEND API (REQUERIDO)
# ============================================
# URL COMPLETA del backend incluyendo /api
# IMPORTANTE: Usar IP de tu máquina, NO localhost
# (El emulador/dispositivo no puede acceder a localhost)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000/api

# ============================================
# FIREBASE (REQUERIDO)
# ============================================
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX

# ============================================
# GOOGLE OAUTH (OPCIONAL)
# ============================================
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu-web-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=tu-android-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=tu-ios-client-id
```

### 3. Encontrar tu IP local

**Windows:**
```powershell
ipconfig | findstr IPv4
```

**macOS/Linux:**
```bash
ifconfig | grep "inet "
```

Usa la IP de tu red local (ej: 192.168.1.100)

### 4. Iniciar Expo

```bash
npm start
```

---

## 🖥️ Configuración del Backend

El frontend espera que el backend tenga los siguientes endpoints:

### Endpoints de Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login con email/password |
| POST | `/api/auth/register` | Registro de usuario |
| POST | `/api/auth/google-login` | Login con Google |
| GET | `/api/auth/me` | Obtener usuario actual |

### Endpoints de Canchas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/canchas` | Listar complejos con canchas |
| GET | `/api/canchas/:complejoId/:canchaId` | Detalle de cancha |

### Endpoints de Reservas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reservas` | Listar reservas del usuario |
| POST | `/api/reservas` | Crear reserva |
| PUT | `/api/reservas/:id/cancelar` | Cancelar reserva |

### Endpoints de Admin
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/admin/reservas` | Listar todas las reservas |
| PATCH | `/api/admin/reservas/:id/cancelar` | Cancelar reserva (admin) |
| PATCH | `/api/admin/reservas/:id/confirmar` | Confirmar reserva |

### Configuración CORS del Backend

El backend debe permitir requests desde el frontend:

```javascript
// Ejemplo en Express.js
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',      // Next.js dev
    'http://192.168.1.100:3000',  // Next.js desde red local
    'exp://192.168.1.100:8081',   // Expo dev
  ],
  credentials: true,
}));
```

---

## 🔄 Cómo funciona el Proxy (Web)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   Next.js   │────▶│   Backend   │
│             │     │   (Proxy)   │     │             │
│ /api/login  │     │ rewrite to  │     │ /api/login  │
└─────────────┘     └─────────────┘     └─────────────┘
     :3000               :3000               :3000
                                        (BACKEND_URL)
```

**Ventajas del proxy:**
1. ✅ Sin problemas de CORS
2. ✅ URLs del backend no expuestas al cliente
3. ✅ Mismo origen = más seguro
4. ✅ Fácil cambiar backend sin rebuild

---

## 🚀 Producción

### Variables de entorno en producción

**Vercel (Next.js):**
```bash
vercel env add BACKEND_URL production
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# ... agregar todas las variables
```

**EAS (Expo):**
Crear archivo `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.tudominio.com/api"
      }
    }
  }
}
```

---

## 🐛 Troubleshooting

### "Network Error" en Mobile
- Verificar que usas IP local, no `localhost`
- Verificar que el backend está corriendo
- Verificar que el firewall permite la conexión

### "401 Unauthorized"
- Verificar que el token JWT está siendo enviado
- Verificar configuración de Firebase en el backend

### Variables de entorno no funcionan
- Reiniciar el servidor de desarrollo
- Verificar que los nombres empiezan con `NEXT_PUBLIC_` (web) o `EXPO_PUBLIC_` (mobile)
- Verificar que el archivo es `.env.local` (web) o `.env` (mobile)

---

## 📞 Soporte

Si tienes problemas:
1. Verificar que el backend está corriendo
2. Revisar los logs del servidor
3. Verificar las variables de entorno
4. Revisar la consola del navegador/Expo
