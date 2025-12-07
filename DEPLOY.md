# Guía de Despliegue en Render

Esta guía te ayudará a desplegar el proyecto en Render de forma segura sin exponer credenciales.

## 📋 Pasos Previos

1. **Asegúrate de tener todo en GitHub**:
   - Todos los archivos están commiteados
   - El `.gitignore` está configurado correctamente
   - No hay credenciales en el código

2. **Prepara tus credenciales de Firebase**:
   - Descarga el archivo `serviceAccountKey.json` desde Firebase Console
   - Abre el archivo y copia todo su contenido

## 🚀 Despliegue en Render

### Paso 1: Crear el Servicio

1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Haz clic en **New +** → **Web Service**
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio `proyecto_control`

### Paso 2: Configurar el Servicio

**Configuración Básica:**
- **Name**: `proyecto-control` (o el nombre que prefieras)
- **Region**: Elige la región más cercana
- **Branch**: `main`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start` ⚠️ **IMPORTANTE**: Debe ser exactamente `npm start`, NO `node script.js`

### Paso 3: Variables de Entorno

En la sección **Environment Variables**, agrega las siguientes variables:

#### 1. Firebase Service Account (JSON completo)

**Nombre**: `FIREBASE_SERVICE_ACCOUNT_JSON`

**Valor**: Todo el contenido de tu `serviceAccountKey.json` como una sola línea.

**Cómo obtenerlo:**
```bash
# Opción 1: Usando jq (si lo tienes instalado)
cat serviceAccountKey.json | jq -c

# Opción 2: Manualmente
# Abre el archivo JSON, copia todo el contenido
# Reemplaza todos los saltos de línea con espacios
# Escapa las comillas dobles: " → \"
```

**Ejemplo del formato:**
```
{"type":"service_account","project_id":"app-z-9ad8d","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

#### 2. Firebase Database URL

**Nombre**: `FIREBASE_DATABASE_URL`

**Valor**: `https://app-z-9ad8d-default-rtdb.firebaseio.com`

#### 3. Firebase Web Config

Agrega estas variables con los valores de tu proyecto Firebase:

- `FIREBASE_API_KEY`: Tu API Key de Firebase
- `FIREBASE_AUTH_DOMAIN`: `app-z-9ad8d.firebaseapp.com`
- `FIREBASE_PROJECT_ID`: `app-z-9ad8d`
- `FIREBASE_STORAGE_BUCKET`: `app-z-9ad8d.firebasestorage.app`
- `FIREBASE_MESSAGING_SENDER_ID`: `699960964593`
- `FIREBASE_APP_ID`: `1:699960964593:web:c4dbf134ef44e71f66c050`

#### 4. Configuración del Servidor

- `PORT`: `5000` (Render asignará automáticamente, pero puedes especificarlo)
- `NODE_ENV`: `production`

### Paso 4: Actualizar Archivos de Frontend

Después del despliegue, necesitas actualizar los archivos de configuración de Firebase en el frontend. Tienes dos opciones:

#### Opción A: Editar directamente en Render (Rápido)

1. Ve a tu servicio en Render
2. En la sección **Logs**, verifica que el servidor esté corriendo
3. Edita manualmente los archivos:
   - `src/public/firebase-config.js`
   - `src/public/scan-firebase.js`
   - `src/public/student-firebase.js`

Reemplaza las credenciales con las de tu proyecto.

#### Opción B: Usar el endpoint de configuración (Recomendado)

Modifica los archivos HTML para cargar la configuración desde el servidor:

```javascript
// En lugar de tener la config hardcodeada
fetch('/api/config/firebase')
  .then(res => res.json())
  .then(config => {
    firebase.initializeApp(config);
  });
```

### Paso 5: Desplegar

1. Haz clic en **Create Web Service**
2. Render comenzará a construir y desplegar tu aplicación
3. Espera a que el build termine (puede tomar 2-5 minutos)
4. Una vez desplegado, tu aplicación estará disponible en `https://tu-servicio.onrender.com`

## ✅ Verificación

1. Visita la URL de tu aplicación
2. Verifica que la página principal cargue correctamente
3. Prueba crear una sesión QR
4. Verifica que el escaneo funcione

## 🔧 Solución de Problemas

### Error: "Firebase Admin SDK initialization failed"

- Verifica que `FIREBASE_SERVICE_ACCOUNT_JSON` esté correctamente formateado
- Asegúrate de que el JSON esté en una sola línea
- Verifica que todas las comillas estén escapadas

### Error: "Cannot find module"

- Verifica que `package.json` tenga todas las dependencias
- Revisa los logs de build en Render

### La aplicación no carga

- Revisa los logs en Render Dashboard
- Verifica que el puerto esté configurado correctamente
- Asegúrate de que todas las variables de entorno estén configuradas

## 📝 Notas Finales

- Render proporciona una URL gratuita que puede tardar en responder en el primer request (cold start)
- Para producción, considera actualizar a un plan de pago para mejor rendimiento
- Los archivos de configuración de Firebase en el frontend son públicos por naturaleza, pero es mejor mantenerlos en variables de entorno cuando sea posible

