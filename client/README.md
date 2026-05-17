# Lynkon App

React Native + Expo Router. Todo el código vive en `src/`.

## Estructura

```
LynkonApp/
├── index.js               # Entry point (importa expo-router)
├── App.jsx                # Shell de compatibilidad
├── app.json               # Config Expo (router root → src/app)
├── babel.config.js
├── metro.config.js
├── tsconfig.json          # Alias @/* → src/*
├── package.json
├── assets/
│   └── fonts/
└── src/
    ├── app/               # Expo Router — file-based routing
    │   ├── _layout.tsx    # Root layout con providers y auth guard
    │   ├── (auth)/        # Pantallas sin tabs
    │   │   ├── welcome.tsx
    │   │   ├── login.tsx
    │   │   ├── register.tsx
    │   │   └── forgot-password.tsx
    │   ├── (tabs)/        # Bottom tab bar
    │   │   ├── profile.tsx   → Tab Inicio
    │   │   ├── social.tsx    → Tab Social
    │   │   └── settings.tsx  → Tab Ajustes
    │   ├── game/
    │   │   └── [gameId].tsx  → Detalle de juego
    │   └── settings/
    │       ├── edit-profile.tsx
    │       ├── change-password.tsx
    │       └── platform/[platform].tsx
    ├── context/
    │   ├── AuthContext.tsx   # Sesión JWT persistida con AsyncStorage
    │   └── ThemeContext.tsx  # Tema oscuro/luminoso
    ├── services/
    │   ├── api.ts            # Axios → Express server
    │   └── mockData.ts       # URLs de avatares de perfil
    └── utils/
        └── responsive.ts     # rw(), rh(), rf(), gridColumns()
```

## Setup

```bash
npm install

# Levantar el server (carpeta server/)
cd server && npm run dev

# Correr en Android Studio (emulador)
npx expo run:android

# O con Expo Go (más rápido para desarrollo)
npx expo start --android
```

## IP del servidor

Editá `src/services/api.ts`:

```ts
// Emulador Android Studio:
export const API_BASE_URL = 'http://10.0.2.2:3000';

// Dispositivo físico:
export const API_BASE_URL = 'http://192.168.X.X:3000';
```

## Imports

Usá el alias `@/` para importar desde `src/`:

```ts
import { useAuth } from '@/context/AuthContext';
import { rw, rf } from '@/utils/responsive';
import { platformApi } from '@/services/api';
```
