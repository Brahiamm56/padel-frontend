# 📱 NorthPadel - Frontend Mobile

Aplicación móvil React Native con Expo para la plataforma NorthPadel (gestión de reservas de canchas de pádel).

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (versión 18.x o superior)
   - Descargar desde: https://nodejs.org/
   - Verificar instalación: `node --version`

2. **npm** (viene con Node.js)
   - Verificar instalación: `npm --version`

3. **Git** (opcional, pero recomendado)
   - Descargar desde: https://git-scm.com/
   - Verificar instalación: `git --version`

4. **Expo Go** (en tu teléfono móvil)
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
   - iOS: https://apps.apple.com/app/expo-go/id982107779

---

## 🚀 Instalación Paso a Paso

### 1️⃣ Clonar el Repositorio

```bash
# Si tienes acceso al repositorio Git
git clone <URL_DEL_REPOSITORIO>
cd mobile

# O si descargaste el ZIP, extrae y navega a la carpeta
cd path/to/mobile
```

### 2️⃣ Instalar Dependencias

```bash
npm install
```

> ⏱️ **Nota**: Este proceso puede tardar 3-5 minutos dependiendo de tu conexión a internet.

### 3️⃣ Configurar Variables de Entorno

#### a) Configurar IP del Backend

**IMPORTANTE**: Debes actualizar la IP del backend según tu red local.

1. Abre el archivo `src/config/api.ts`
2. Cambia la IP en la línea 3:

```typescript
// Antes:
export const API_BASE_URL = 'http://192.168.100.2:3000/api';

// Después (usa la IP de tu computadora donde corre el backend):
export const API_BASE_URL = 'http://TU_IP_LOCAL:3000/api';
```

**¿Cómo obtener tu IP local?**
- **Windows**: Abre CMD y ejecuta `ipconfig`, busca "IPv4 Address"
- **Mac/Linux**: Abre Terminal y ejecuta `ifconfig` o `ip addr`

#### b) Configurar Cloudinary (si usas imágenes)

1. Abre el archivo `src/config/cloudinary.ts`
2. Verifica que tenga la configuración correcta:

```typescript
export const CLOUDINARY_CONFIG = {
  cloudName: 'dzgawfylm',
  uploadPreset: 'northpadel_unsigned',
};
```

> ℹ️ **Nota**: Si estás configurando en producción con otro Cloudinary, contacta al administrador.

#### c) Verificar Configuración de Firebase

El archivo `src/config/firebase.ts` ya contiene la configuración necesaria. **No modificar** a menos que uses un proyecto Firebase diferente.

---

### 4️⃣ Configurar Archivos de Google Services (Android)

Si vas a compilar para Android, verifica que existan los siguientes archivos:

- `google-services (1).json` en la raíz del proyecto
- `GoogleService-Info.plist` (para iOS) en la raíz del proyecto

> ⚠️ **Importante**: Estos archivos ya están incluidos en el proyecto. Si faltan, contacta al administrador.

---

## ▶️ Ejecutar la Aplicación

### Opción 1: Modo Desarrollo (Recomendado)

```bash
npm start
```

o con caché limpio:

```bash
npx expo start -c
```

Esto abrirá **Metro Bundler** en tu navegador con un código QR.

**Pasos siguientes:**
1. Abre **Expo Go** en tu teléfono
2. Escanea el código QR:
   - **Android**: Directamente desde la app Expo Go
   - **iOS**: Usa la cámara del iPhone y presiona el banner de Expo Go

### Opción 2: Correr en Emulador

#### Android Emulator:
```bash
npm run android
```

#### iOS Simulator (solo Mac):
```bash
npm run ios
```

> ⚠️ **Nota**: Para iOS, necesitas Xcode instalado (solo disponible en Mac).

---

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run android` - Compila y ejecuta en Android
- `npm run ios` - Compila y ejecuta en iOS (solo Mac)
- `npm run web` - Ejecuta en navegador web

---

## 📁 Estructura del Proyecto

```
mobile/
├── src/
│   ├── config/          # Configuraciones (API, Firebase, Cloudinary)
│   ├── features/        # Módulos por funcionalidad
│   │   ├── auth/        # Autenticación
│   │   ├── user/        # Perfil de usuario
│   │   ├── reservas/    # Sistema de reservas
│   │   ├── admin/       # Panel de administración
│   │   └── canchas/     # Vista de canchas
│   ├── navigation/      # Navegación de la app
│   └── styles/          # Estilos globales
├── assets/              # Imágenes, iconos, fuentes
├── App.tsx              # Punto de entrada principal
├── app.json             # Configuración de Expo
└── package.json         # Dependencias del proyecto
```

---

## ⚙️ Configuración Importante

### Conexión con el Backend

La aplicación se conecta al backend Node.js para:
- Autenticación (JWT)
- Gestión de reservas
- Perfil de usuario
- Administración de canchas

**Asegúrate de que el backend esté corriendo** antes de probar la app.

### Variables Clave a Revisar

| Archivo | Variable | Descripción |
|---------|----------|-------------|
| `src/config/api.ts` | `API_BASE_URL` | URL del backend |
| `src/config/cloudinary.ts` | `CLOUDINARY_CONFIG` | Configuración de Cloudinary |
| `src/config/firebase.ts` | `firebaseConfig` | Configuración de Firebase |

---

## 🐛 Solución de Problemas Comunes

### 1. Error: "Unable to resolve module"
```bash
# Limpiar caché y reinstalar
rm -rf node_modules
npm install
npx expo start -c
```

### 2. Error de conexión con el backend
- Verificar que el backend esté corriendo en `http://localhost:3000`
- Revisar que la IP en `src/config/api.ts` sea correcta
- Asegurarse de estar en la misma red WiFi (móvil y computadora)

### 3. Error: "Network request failed"
- El teléfono y la computadora deben estar en la **misma red WiFi**
- Verificar que el firewall no bloquee la conexión
- En Windows: Permitir Node.js en Firewall de Windows

### 4. Problemas con Firebase Auth
```bash
# Reinstalar dependencias de Firebase
npm install firebase@latest
npx expo start -c
```

### 5. Expo Go no se conecta
```bash
# Reiniciar el servidor con túnel
npx expo start --tunnel
```

---

## 📦 Dependencias Principales

- **React Native** (0.81.4) - Framework base
- **Expo** (~54.0.13) - Plataforma de desarrollo
- **React Navigation** (^7.x) - Navegación
- **Firebase** (^12.4.0) - Backend as a Service
- **Axios** (^1.12.2) - Cliente HTTP
- **AsyncStorage** (2.2.0) - Almacenamiento local
- **Expo Image Picker** (~17.0.8) - Selección de imágenes
- **Expo Notifications** (~0.32.12) - Push notifications

---

## 🔐 Credenciales de Prueba

Para probar la aplicación, puedes usar:

**Usuario Cliente:**
- Email: `cliente@test.com`
- Password: `123456`

**Usuario Admin:**
- Email: `admin@test.com`
- Password: `123456`

> ⚠️ **Importante**: Estas son credenciales de prueba. En producción, usar credenciales seguras.

---

## 📱 Funcionalidades Implementadas

### Para Usuarios (Clientes):
- ✅ Registro e inicio de sesión
- ✅ Visualización de canchas disponibles
- ✅ Búsqueda y filtrado de canchas
- ✅ Sistema de reservas con calendario
- ✅ Gestión del perfil de usuario
- ✅ Historial de reservas
- ✅ Notificaciones push

### Para Administradores:
- ✅ Panel de administración
- ✅ Gestión de canchas (crear, editar, eliminar)
- ✅ Toggle de estado de canchas (activa/pausada)
- ✅ Visualización de reservas
- ✅ Gestión de complejo deportivo
- ✅ Subida de imágenes (Cloudinary)

---

## 🚨 Notas Importantes

1. **Tokens JWT expiran**: Si ves errores de "Token no válido", cierra sesión y vuelve a entrar.

2. **Caché del backend**: Si los datos no se actualizan, verifica los logs del backend.

3. **Permisos de la app**: La primera vez que uses la cámara o galería, debes aceptar los permisos.

4. **Hot Reload**: Los cambios en el código se reflejan automáticamente sin reiniciar la app.

5. **Cloudinary**: Las imágenes se suben directamente a Cloudinary usando un upload preset público.

---

## 📞 Soporte

Si encuentras problemas o tienes preguntas:

1. Revisa la sección **Solución de Problemas** arriba
2. Verifica los logs en la terminal donde corre `npm start`
3. Revisa los logs del backend
4. Contacta al equipo de desarrollo

---

## 📝 Changelog

### v1.0.0 (Actual)
- ✅ Sistema completo de autenticación con Firebase + JWT
- ✅ Integración con backend Node.js
- ✅ Gestión de perfil con subida de fotos
- ✅ Sistema de reservas funcional
- ✅ Panel administrativo completo
- ✅ Normalización de campos `publicada`/`activa`
- ✅ Actualización optimista en toggles

---

## 📄 Licencia

Este proyecto es privado y confidencial. No distribuir sin autorización.

---

**Desarrollado por el equipo NorthPadel** 🎾
