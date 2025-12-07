# 🔐 Variables de Entorno para Render

Esta guía te muestra exactamente qué variables de entorno configurar en Render.

## 📋 Lista Completa de Variables

Copia y pega estas variables en la sección **Environment Variables** de Render:

### 1. Firebase Service Account (OBLIGATORIO)

**Nombre de la variable:**
```
FIREBASE_SERVICE_ACCOUNT_JSON
```

**Valor:**
Todo el contenido de tu archivo `serviceAccountKey.json.json` como una sola línea JSON.

**Cómo obtenerlo:**
1. Abre tu archivo `serviceAccountKey.json.json`
2. Copia TODO el contenido
3. Conviértelo a una sola línea (sin saltos de línea)
4. Escapa las comillas dobles: `"` → `\"`

**O usa el script:**
```bash
npm run prepare-env
```

**Ejemplo del formato:**
```
{"type":"service_account","project_id":"app-z-9ad8d","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@app-z-9ad8d.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40app-z-9ad8d.iam.gserviceaccount.com"}
```

---

### 2. Firebase Database URL

**Nombre de la variable:**
```
FIREBASE_DATABASE_URL
```

**Valor:**
```
https://app-z-9ad8d-default-rtdb.firebaseio.com
```

---

### 3. Firebase Web Config - API Key

**Nombre de la variable:**
```
FIREBASE_API_KEY
```

**Valor:**
```
AIzaSyBPTiZPuy5wwR5VcmQvECaCI0QP4MF-n6w
```

---

### 4. Firebase Web Config - Auth Domain

**Nombre de la variable:**
```
FIREBASE_AUTH_DOMAIN
```

**Valor:**
```
app-z-9ad8d.firebaseapp.com
```

---

### 5. Firebase Web Config - Project ID

**Nombre de la variable:**
```
FIREBASE_PROJECT_ID
```

**Valor:**
```
app-z-9ad8d
```

---

### 6. Firebase Web Config - Storage Bucket

**Nombre de la variable:**
```
FIREBASE_STORAGE_BUCKET
```

**Valor:**
```
app-z-9ad8d.firebasestorage.app
```

---

### 7. Firebase Web Config - Messaging Sender ID

**Nombre de la variable:**
```
FIREBASE_MESSAGING_SENDER_ID
```

**Valor:**
```
699960964593
```

---

### 8. Firebase Web Config - App ID

**Nombre de la variable:**
```
FIREBASE_APP_ID
```

**Valor:**
```
1:699960964593:web:c4dbf134ef44e71f66c050
```

---

### 9. Puerto del Servidor (OPCIONAL)

**Nombre de la variable:**
```
PORT
```

**Valor:**
```
5000
```

**Nota:** Render asigna automáticamente un puerto, pero puedes especificarlo.

---

### 10. Entorno (OPCIONAL pero recomendado)

**Nombre de la variable:**
```
NODE_ENV
```

**Valor:**
```
production
```

---

## 📝 Resumen Rápido para Copiar

Aquí tienes un resumen en formato tabla para facilitar la configuración:

| Variable | Valor |
|----------|-------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | [Ver instrucciones arriba] |
| `FIREBASE_DATABASE_URL` | `https://app-z-9ad8d-default-rtdb.firebaseio.com` |
| `FIREBASE_API_KEY` | `AIzaSyBPTiZPuy5wwR5VcmQvECaCI0QP4MF-n6w` |
| `FIREBASE_AUTH_DOMAIN` | `app-z-9ad8d.firebaseapp.com` |
| `FIREBASE_PROJECT_ID` | `app-z-9ad8d` |
| `FIREBASE_STORAGE_BUCKET` | `app-z-9ad8d.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `699960964593` |
| `FIREBASE_APP_ID` | `1:699960964593:web:c4dbf134ef44e71f66c050` |
| `PORT` | `5000` (opcional) |
| `NODE_ENV` | `production` (opcional) |

## 🚀 Pasos en Render

1. Ve a tu servicio en Render Dashboard
2. Haz clic en **Environment** en el menú lateral
3. Haz clic en **Add Environment Variable**
4. Agrega cada variable una por una:
   - **Key**: El nombre de la variable (ej: `FIREBASE_API_KEY`)
   - **Value**: El valor correspondiente
5. Repite para todas las variables
6. Guarda los cambios
7. Render reiniciará automáticamente tu servicio

## ⚠️ Importante

- **FIREBASE_SERVICE_ACCOUNT_JSON** es la más importante y debe estar en una sola línea
- No agregues comillas alrededor de los valores (excepto en el JSON)
- Las variables son case-sensitive (mayúsculas/minúsculas importan)
- Después de agregar las variables, Render reiniciará automáticamente

## ✅ Verificación

Después de configurar las variables, verifica en los logs de Render que:
- ✅ No hay errores de "Firebase Admin SDK initialization failed"
- ✅ El servidor inicia correctamente
- ✅ No hay errores de "Cannot find module"

## 🔧 Si algo falla

1. Verifica que `FIREBASE_SERVICE_ACCOUNT_JSON` esté en una sola línea
2. Verifica que todas las comillas estén escapadas correctamente
3. Revisa los logs de Render para ver el error específico
4. Asegúrate de que todas las variables estén escritas correctamente (sin espacios extra)

