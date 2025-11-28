# Padel Frontend - Monorepo

Este proyecto está organizado como un monorepo que contiene tanto la aplicación móvil (React Native/Expo) como la aplicación web (Next.js), compartiendo código común entre ambas plataformas.

## 📁 Estructura del Proyecto

```
padel-frontend/
├── apps/
│   ├── mobile/          # App móvil React Native/Expo (código existente)
│   └── web/             # App web Next.js (nueva)
├── packages/
│   └── shared/          # Código compartido
│       ├── types/       # Tipos TypeScript
│       ├── services/    # Servicios API
│       └── config/      # Configuraciones
├── package.root.json    # Package.json del monorepo (renombrar a package.json)
└── README.md
```

## 🚀 Instalación

### 1. Configurar el Monorepo

```bash
# En la raíz del proyecto, renombrar package.root.json
mv package.root.json package.json.new

# Mover la app móvil existente a apps/mobile
mkdir -p apps/mobile
# Mover todos los archivos existentes (excepto apps/, packages/, package.root.json) a apps/mobile

# Luego renombrar el package.json
mv package.json.new package.json
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias del workspace
npm install

# O si prefieres usar npm workspaces
npm install --workspaces
```

### 3. Configurar Variables de Entorno

#### Para Web (apps/web):
```bash
cd apps/web
cp .env.local.example .env.local
# Editar .env.local con la URL del backend
```

## 🏃 Ejecutar los Proyectos

### App Web (Next.js)
```bash
cd apps/web
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000)

### App Móvil (Expo)
```bash
cd apps/mobile
npm start
```

## 📦 Código Compartido (@padel/shared)

El paquete `@padel/shared` contiene:

### Tipos (`packages/shared/types/`)
- `auth.types.ts` - Tipos de autenticación (User, LoginCredentials, etc.)
- `reservas.types.ts` - Tipos de reservas
- `canchas.types.ts` - Tipos de canchas y complejos

### Servicios (`packages/shared/services/`)
Los servicios son factories que reciben configuración específica de cada plataforma:

```typescript
import { createAuthService } from '@padel/shared';

// En web (usando localStorage)
const authService = createAuthService({
  getToken: async () => localStorage.getItem('token'),
  setToken: async (token) => localStorage.setItem('token', token),
});

// En mobile (usando AsyncStorage)
const authService = createAuthService({
  getToken: async () => AsyncStorage.getItem('token'),
  setToken: async (token) => AsyncStorage.setItem('token', token),
});
```

### Configuración (`packages/shared/config/`)
- `api.config.ts` - Endpoints y configuración de API
- `firebase.config.ts` - Configuración de Firebase

## 🛠 Desarrollo

### Agregar nuevos tipos compartidos
1. Crear/editar archivos en `packages/shared/types/`
2. Exportar desde `packages/shared/types/index.ts`

### Agregar nuevos servicios compartidos
1. Crear/editar archivos en `packages/shared/services/`
2. Exportar desde `packages/shared/services/index.ts`

## 📱 Features Web

La app web incluye:
- ✅ Autenticación (Login/Register)
- ✅ Dashboard de usuario
- ✅ Listado de canchas
- ✅ Sistema de reservas
- ✅ Diseño responsive con Tailwind CSS
- ✅ Tema oscuro

## 🔜 Próximos Pasos

1. [ ] Panel de administración web
2. [ ] Historial de reservas
3. [ ] Perfil de usuario editable
4. [ ] Integración con Google Auth
5. [ ] Notificaciones push web
6. [ ] PWA (Progressive Web App)

## 📝 Notas

- La app móvil sigue funcionando de forma independiente
- Los servicios compartidos son independientes de plataforma
- La configuración de Firebase es compartida pero la inicialización es específica por plataforma
