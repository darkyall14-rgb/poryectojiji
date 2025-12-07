# 🔧 Solución de Problemas en Render

## ❌ Error: Cannot find module '/opt/render/project/src/script.js'

### Problema
Render está intentando ejecutar `script.js` que no existe.

### ✅ Solución

1. **Verifica que `package.json` tenga la configuración correcta:**

```json
{
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  }
}
```

2. **En Render Dashboard, verifica la configuración:**

   - Ve a tu servicio en Render
   - Haz clic en **Settings**
   - Verifica que **Start Command** sea: `npm start`
   - Verifica que **Build Command** sea: `npm install`

3. **Si el problema persiste:**

   - Ve a **Settings** → **Build & Deploy**
   - Asegúrate de que:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
   - Guarda los cambios
   - Render reiniciará automáticamente

## ✅ Configuración Correcta en Render

### Build & Deploy Settings:

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Auto-Deploy**: `Yes` (recomendado)

### Environment:

- Todas las variables de entorno configuradas (ver `RENDER-ENV-VARIABLES.md`)

## 🔍 Verificación Post-Fix

Después de corregir, verifica en los logs:

1. ✅ El build se completa sin errores
2. ✅ El servidor inicia con: `Servidor corriendo en:`
3. ✅ No hay errores de módulos faltantes
4. ✅ La aplicación responde en la URL de Render

## 📝 Notas Importantes

- El archivo principal debe ser `server.js`, no `script.js`
- El comando de inicio debe ser `npm start`, no `node script.js`
- Asegúrate de que `package.json` esté actualizado en GitHub antes de desplegar

