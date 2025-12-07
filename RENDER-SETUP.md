# 📝 Configuración de Variables de Entorno en Render

## Resumen de Cambios de Seguridad

Por razones de seguridad, las credenciales de Firebase ahora se cargan desde variables de entorno, **NO desde el código**.

## Variables Necesarias en Render

Ve a tu aplicación en Render y añade estas variables en **Environment**:

### 1. Firebase Admin SDK (Credenciales Privadas)

```
FIREBASE_SERVICE_ACCOUNT_JSON
```

**Valor:** El contenido COMPLETO del archivo `serviceAccountKey.json` como string JSON.

**Cómo obtenerlo:**
1. En tu computadora, abre el archivo `serviceAccountKey.json`
2. Copia TODO el contenido
3. Pégalo en Render como variable `FIREBASE_SERVICE_ACCOUNT_JSON`

### 2. Firebase Database URL

```
FIREBASE_DATABASE_URL=https://xanes-36606-default-rtdb.firebaseio.com
```

### 3. Firebase Web Config (Públicas - OK exponer)

```
FIREBASE_API_KEY=AIzaSyC7-a1mwVT-OuiBaik7YYP5KyK4XUPKqvI
FIREBASE_AUTH_DOMAIN=xanes-36606.firebaseapp.com
FIREBASE_PROJECT_ID=xanes-36606
FIREBASE_STORAGE_BUCKET=xanes-36606.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=853187362328
FIREBASE_APP_ID=1:853187362328:web:ce602f8be9a2293e9ecd6d
```

### 4. Server Config

```
PORT=10000
NODE_ENV=production
RENDER_EXTERNAL_URL=https://poryectojiji.onrender.com
```

## Pasos en Render Dashboard

1. Ve a tu aplicación en https://dashboard.render.com
2. Haz clic en "Environment" en el menú izquierdo
3. Haz clic en "Add Environment Variable"
4. Para cada variable:
   - **Key:** Nombre exacto (ej: `FIREBASE_API_KEY`)
   - **Value:** El valor
   - Haz clic en "Add"
5. Haz clic en "Deploy" para reiniciar la aplicación

## Diferencia Entre Dev y Production

### Local (`.env` file)
```
# .env (PRIVADO - nunca en git)
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_API_KEY=...
FIREBASE_DATABASE_URL=...
```

### Render (Environment Variables)
```
# Dashboard de Render
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_API_KEY=...
FIREBASE_DATABASE_URL=...
```

## Verificar que Funciona

1. **Local:**
   ```bash
   npm start
   # Debe mostrar:
   # ✅ Firebase Admin SDK initialized successfully
   ```

2. **En Render:**
   - Abre la aplicación en https://poryectojiji.onrender.com
   - Abre la consola del navegador (F12)
   - Busca: `✅ Firebase initialized from server config`
   - Intenta login (si funciona, las credenciales están bien)

## Solución de Problemas

### Error: "FIREBASE_SERVICE_ACCOUNT_JSON is invalid"
- Verificar que el JSON está completo
- No debe tener saltos de línea extras
- Debe ser válido JSON

### Error: "Firebase Admin SDK initialization failed"
- El `serviceAccountKey.json` tiene credenciales del proyecto equivocado
- Necesita ser de `xanes-36606`
- [Ver cómo obtener credenciales correctas](/GET-CREDENTIALS.md)

### Error: "HTTP 502 Bad Gateway"
- Render aún está iniciando
- Espera 30-60 segundos y recarga
- Verifica que todas las variables de entorno están correctas

## ¿Qué NO necesita en Render?

- ❌ `FIREBASE_SERVICE_ACCOUNT_PATH` (usa `FIREBASE_SERVICE_ACCOUNT_JSON` en su lugar)
- ❌ Descargar `serviceAccountKey.json` en Render (está en variables de entorno)

## Seguridad

- ✅ Las credenciales de Admin SDK están protegidas en Render
- ✅ Solo el servidor las ve (no el navegador)
- ✅ El navegador recibe solo la config pública (que es segura)
- ✅ No hay secretos en el repositorio de GitHub
