# Lynkon Backend

API REST para **Lynkon** — unificador de perfiles de videojuegos multiplataforma.

**Stack:** Node.js · Express · Firebase (Firestore + Auth) · Firebase Realtime Database

---

## Estructura

```
lynkon-backend/
├── src/
│   ├── app.js                        # Express app
│   ├── server.js                     # Entry point
│   ├── config/
│   │   └── firebase.js               # Firebase Admin SDK
│   ├── dtos/                         # Validación y serialización de datos
│   │   ├── auth.dto.js
│   │   ├── user.dto.js
│   │   ├── platform.dto.js
│   │   ├── friend.dto.js
│   │   └── message.dto.js
│   ├── middleware/
│   │   └── auth.middleware.js        # Verificación de token + ownership
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── platform.routes.js
│   │   ├── friend.routes.js
│   │   └── message.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── platform.controller.js
│   │   ├── friend.controller.js
│   │   └── message.controller.js
│   ├── services/                     # Integraciones con APIs externas
│   │   ├── steam.service.js          # ✅ Steam Web API
│   │   ├── xbox.service.js           # ✅ xbl.io
│   │   └── psn.service.js            # 🔧 Stub listo (requiere psn-api)
│   └── utils/
│       └── username.utils.js         # Generador de username automático
└── tests/
    ├── controllers/
    │   ├── auth.test.js
    │   └── user.test.js
    └── dtos/
        └── dto.test.js               # Tests unitarios de todos los DTOs
```

---

## Setup

```bash
npm install
cp .env.example .env
# Completar las variables en .env
npm run dev
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (default: 3000) |
| `FIREBASE_SERVICE_ACCOUNT` | JSON del service account de Firebase como string |
| `FIREBASE_DATABASE_URL` | URL de Firebase Realtime Database |
| `STEAM_API_KEY` | Clave de Steam Web API (steamcommunity.com/dev) |
| `XBL_API_KEY` | Clave de xbl.io (gratuita) |

---

## Endpoints

Todos los endpoints requieren `Authorization: Bearer <Firebase ID Token>` salvo los de `/api/auth`.

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crea perfil en Firestore post-registro Firebase |
| POST | `/api/auth/login` | Verifica token y retorna datos del perfil |

### Users
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/users/search?q=` | 🔒 | Busca usuarios por username |
| GET | `/api/users/:id/profile` | 🔒 | Perfil público (o completo si es owner) |
| POST | `/api/users/:id/profile` | 🔒 owner | Crea perfil inicial |
| PATCH | `/api/users/:id/profile` | 🔒 owner | Edita bio, avatar, juegos favoritos, logros |
| GET | `/api/users/:id/settings` | 🔒 owner | Obtiene configuración |
| POST | `/api/users/:id/settings` | 🔒 owner | Inicializa configuración |
| PATCH | `/api/users/:id/settings` | 🔒 owner | Actualiza notificaciones / privacidad |
| GET | `/api/users/:id/recommendations` | 🔒 owner | Usuarios con juegos similares (solo +16 años) |
| DELETE | `/api/users/:id` | 🔒 owner | Elimina cuenta y datos |

### Platforms
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/platforms/supported` | 🔒 | Lista plataformas disponibles |
| GET | `/api/platforms/:userId` | 🔒 | Plataformas vinculadas del usuario |
| POST | `/api/platforms/:userId/link` | 🔒 owner | Vincula una plataforma |
| DELETE | `/api/platforms/:userId/:platform` | 🔒 owner | Desvincula una plataforma |
| GET | `/api/platforms/:userId/:platform/stats` | 🔒 | Estadísticas generales |
| GET | `/api/platforms/:userId/:platform/games` | 🔒 | Lista de juegos |
| GET | `/api/platforms/:userId/:platform/achievements` | 🔒 | Logros |

### Friends
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/friends/:userId` | 🔒 | Lista de amigos |
| GET | `/api/friends/:userId/requests` | 🔒 owner | Solicitudes pendientes recibidas |
| POST | `/api/friends/:userId/requests` | 🔒 owner | Envía solicitud de amistad |
| PATCH | `/api/friends/:userId/requests/:requestId` | 🔒 owner | Acepta o rechaza solicitud |
| DELETE | `/api/friends/:userId/:friendId` | 🔒 owner | Elimina un amigo |

### Messages
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/messages/:userId` | 🔒 owner | Lista de conversaciones activas |
| GET | `/api/messages/:userId/:friendId` | 🔒 owner | Historial paginado (`?limit=50&before=<ISO>`) |
| POST | `/api/messages/:userId` | 🔒 owner | Envía mensaje de texto |
| PATCH | `/api/messages/:userId/:messageId` | 🔒 owner | Marca mensaje como leído |
| DELETE | `/api/messages/:userId` | 🔒 owner | Elimina conversación (soft delete) |

---

## DTOs

Los DTOs validan, normalizan y serializan todos los datos de entrada/salida:

- **`parseXxxDTO(body)`** → `{ data, errors[] }` — validación de input
- **`serializeXxx(data)`** → objeto limpio sin campos sensibles — serialización de output

```js
// Ejemplo de uso en un controller
const { data, errors } = parseUpdateProfileDTO(req.body);
if (errors.length) return res.status(400).json({ errors });
// usar data...
```

---

## Testing

```bash
npm test              # Jest con coverage
npm run test:watch    # Modo watch
```

- **`tests/controllers/`** — tests de integración de endpoints con Supertest (Firebase mockeado)
- **`tests/dtos/`** — tests unitarios puros de validación de DTOs

---

## Notas de implementación

### Autenticación
El login/registro ocurre en el **cliente React Native** con el Firebase SDK.
El backend solo verifica el `idToken` via `firebase-admin`. Nunca maneja contraseñas.

### Chat en tiempo real
El historial se persiste en **Firestore**. Para el tiempo real en el cliente, usar
`onSnapshot()` de Firestore SDK directamente desde React Native — sin polling al backend.

### Control de edad
Usuarios menores de 16 años tienen bloqueado el endpoint `/recommendations`.
La edad se calcula al registrarse y se persiste como `isUnder16: boolean`.

### PSN
Requiere instalar `psn-api` (`npm install psn-api`) y descomentar el código en `psn.service.js`.
El usuario debe proveer su `npsso` token (obtenido desde las cookies de PSN en el navegador).
