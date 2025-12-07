# Guía: Debugear por qué no se guardan los datos de asistencia

## Pasos para identificar el problema

### 1. **Verificar que la sesión QR se crea correctamente**

1. Abre el navegador en tu computadora local
2. Ingresa a: `http://localhost:5000/student`
3. Rellena el formulario:
   - **Curso ID**: `TEST-001`
   - **Nombre del Curso**: `Prueba`
   - Haz clic en **"Generar QR"**

**¿Qué debe pasar?**
- Debe aparecer un QR al lado
- La consola del navegador (F12) debe mostrar: `✅ QR generado exitosamente`

✅ Si esto funciona → **La sesión se está creando en Firebase**

---

### 2. **Verificar que el estudiante puede llenar datos y activar la cámara**

1. Abre otra pestaña: `http://localhost:5000/scan`
2. Rellena los datos del estudiante:
   - **Nombre**: `Juan Perez`
   - **Número de Identificación**: `123456789`
   - **Email**: `juan@test.com`
   - **Teléfono**: `+57 300 1234567`
3. Haz clic en **"Continuar"**

**¿Qué debe pasar?**
- Se debe activar la cámara
- La consola (F12) debe mostrar:
  ```
  Datos del formulario: {name: "Juan Perez", id: "123456789", email: "juan@test.com", phone: "+57 300 1234567"}
  Variables globales establecidas: {...}
  Inicializando cámara...
  ```

✅ Si ves estos logs → **Los datos se están guardando en variables**

---

### 3. **Verificar que el QR se detecta**

1. Abre las dos pestañas lado a lado
2. Intenta escanear el QR generado en la pestaña del docente
3. Abre la consola (F12) en la pestaña de `/scan`

**Busca estos logs en orden:**
```
QR detectado: http://localhost:5000/scan?sessionId=xxxx
Session ID extraido: xxxx
Registrando asistencia para sesion: xxxx
Datos a enviar al servidor: {...}
URL de endpoint: /api/sessions/xxxx/attendance
```

✅ Si ves estos logs → **El QR se detectó correctamente**

---

### 4. **Verificar que el servidor recibe y guarda la asistencia**

1. Abre la consola del **servidor** (donde ejecutas `npm start`)
2. Busca logs como estos después de escanear:

```
[markAttendance] Solicitud recibida: {
  sessionId: 'xxxx',
  studentId: '123456789',
  studentName: 'Juan Perez',
  studentEmail: 'juan@test.com',
  studentPhone: '+57 300 1234567'
}
[markAttendance] Sesión encontrada: Prueba
[markAttendance] Preparado para guardar asistencia
201 POST /api/sessions/xxxx/attendance

[markAttendance] Iniciando guardado asincrónico en Firebase
[markAttendance] Guardando asistente en: sessions/xxxx/attendees/123456789
[markAttendance] Actualizando array de asistentes
[markAttendance] Guardando en path global de asistencia
[markAttendance] Asistencia completamente guardada: Juan Perez en sesion xxxx
```

✅ Si ves todos estos logs → **El servidor está guardando en Firebase**

---

### 5. **Verificar que los datos están en Firebase**

1. Ve a la consola de Firebase: https://console.firebase.google.com
2. Selecciona tu proyecto
3. Ve a **Realtime Database**
4. Busca estas rutas:

```
sessions/
  {sessionId}/
    attendees/
      {studentId}/ ← Debe estar aquí

attendance/
  {timestamp}_{sessionId}_{studentId}/ ← Debe estar aquí
```

✅ Si ves datos aquí → **Todo está guardándose correctamente**

---

## Resolución de Problemas

### ❌ Si falta "Solicitud recibida"
- El endpoint `/api/sessions/{sessionId}/attendance` no está siendo alcanzado
- Verifica que `sessionId` sea válido
- Verifica que la URL sea `/api/sessions/{sessionId}/attendance`

### ❌ Si falta "Sesión encontrada"
- La sesión QR NO existe en Firebase
- Vuelve al paso 1 y genera un nuevo QR

### ❌ Si falta "Asistencia completamente guardada"
- Hay error en Firebase durante el guardado
- Revisa las credenciales de Firebase en `.env`
- Verifica permisos en las reglas de Firebase

### ❌ Si NO ves logs en el navegador
- Abre DevTools: **F12 → Console**
- Recarga la página: **F5**
- Intenta de nuevo

---

## Pasos a Reportar

Copia y pega **EXACTAMENTE** estos logs cuando reportes el problema:

1. **Logs del navegador** en `/scan` (F12 → Console)
2. **Logs del servidor** (consola donde ejecutas `npm start`)
3. **Captura de Firebase Console** mostrando la ruta `sessions/`

Con esto podré identificar exactamente dónde está fallando.
