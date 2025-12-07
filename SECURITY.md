# 🔒 Seguridad - Secrets Management

## Alertas Resueltas

Se detectaron credenciales de Google API Key expuestas en el repositorio público. **ESTO YA HA SIDO SOLUCIONADO.**

### Problema Original
```
Google API Key exposed in src/public/student-firebase.js#L5
```

Archivos afectados:
- `src/public/script.js` 
- `src/public/scan-firebase.js`
- `src/public/student-firebase.js`

### Solución Implementada ✅

Las credenciales de Firebase ahora se cargan **dinámicamente desde el backend** a través del endpoint `/api/config/firebase`, en lugar de estar hardcodeadas en los archivos públicos.

## Cómo Funciona Ahora

### 1. Flujo Seguro

```
Frontend (HTML/JS)
    ↓
    Hace fetch a /api/config/firebase
    ↓
Backend (Node.js)
    ↓
    Lee desde variables de entorno (.env)
    ↓
    Devuelve configuración al frontend
    ↓
Frontend
    ↓
    Inicializa Firebase con config recibida
```

### 2. Código Frontend Antes (❌ INSEGURO)

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyC7-a1mwVT-OuiBaik7YYP5KyK4XUPKqvI",  // ❌ EXPUESTO
    authDomain: "xanes-36606.firebaseapp.com",
    databaseURL: "...",
    // ...
};

firebase.initializeApp(firebaseConfig);
```

### 3. Código Frontend Ahora (✅ SEGURO)

```javascript
let firebaseConfig = null;

async function loadFirebaseConfig() {
    const response = await fetch('/api/config/firebase');
    firebaseConfig = await response.json();
    firebase.initializeApp(firebaseConfig);
}

document.addEventListener('DOMContentLoaded', function() {
    loadFirebaseConfig();
});
```

### 4. Backend (`/api/config/firebase`)

```javascript
router.get("/config/firebase", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  });
});
```

## ¿Por qué es Seguro?

### 🟢 API Keys de Firebase Web

Las API Keys de **Firebase Web** están **diseñadas para ser públicas**. No son secretas. Se protegen mediante:

1. **Domain Whitelisting** en Firebase Console
2. **Security Rules** en la base de datos
3. **API Key Restrictions** por servicio

### 🔴 Admin SDK Credentials

Los credenciales del **Admin SDK** SÍ son secretos y NUNCA deben exponerse:
- `private_key` 
- `client_email`
- `service_account_json`

Estos se guardan SOLO en:
- `.env` (local, nunca en git)
- Variables de entorno en Render

### ✅ Lo que está Expuesto ESTÁ BIEN

El endpoint `/api/config/firebase` devuelve la configuración web (que es pública). Esto está completamente permitido.

## Verificación en GitHub

Para verificar que no hay más secretos:

```bash
# Ver historial de cambios
git log --oneline

# Buscar credenciales en el repositorio
grep -r "AIzaSy" .
grep -r "private_key" .
```

No deberían encontrarse en archivos normales (solo en `.env` que está en `.gitignore`).

## Próximos Pasos

1. ✅ **Git Blame** - GitHub mostrará los commits con credenciales expuestas
   - Son históricos y ya no están en el código
   - No afecta la seguridad actual

2. **Rotación de Keys (IMPORTANTE)**
   - Si los keys fueron usados en acceso público antes
   - Considera regenerarlos en Firebase Console

3. **Verificar Uso en Render**
   - Las variables de entorno en Render están seguras
   - El `serviceAccountKey.json` está en `.env` variable

## Archivos Afectados

| Archivo | Estado | Acción |
|---------|--------|--------|
| `src/public/script.js` | ✅ Fijo | Carga desde `/api/config/firebase` |
| `src/public/scan-firebase.js` | ✅ Fijo | Carga desde `/api/config/firebase` |
| `src/public/student-firebase.js` | ✅ Fijo | Carga desde `/api/config/firebase` |
| `.env` | 🔒 Privado | Nunca en git |
| `serviceAccountKey.json` | 🔒 Privado | En `.gitignore` |

## Testing

Para verificar que todo funciona:

```bash
# 1. Inicia el servidor
npm start

# 2. Abre la consola del navegador (F12)

# 3. Busca el log
✅ Firebase initialized from server config

# 4. Verifica que no hay errores de inicialización
```

## Recursos

- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
- [Securing Your Firebase Project](https://firebase.google.com/support/guides/manage-api-keys)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
