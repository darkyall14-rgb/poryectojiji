# Usando Datos Reales de Firebase en scan.html

## Cambios Realizados

Se eliminó `localStorage` y ahora `scan.html` obtiene datos directamente de **Firebase Realtime Database**.

## Flujo de Datos

### 1. **Inicialización (Al cargar la página)**
```
scan.html carga
  ↓
initializeFirebase() → Carga configuración de Firebase
  ↓
loadStudentDataFromFirebase() → Obtiene datos del usuario autenticado
  ↓
Si hay usuario autenticado → Carga datos de: /students/{userId}
Si NO hay usuario → Formulario vacío para ingreso manual
```

### 2. **Estructura de Datos en Firebase**

Los datos del estudiante se guardan en la ruta:
```
/students/{userId}/
  ├── id: "123456789"
  ├── name: "Juan Pérez"
  ├── email: "juan@email.com"
  └── phone: "+57 300 123 4567"
```

### 3. **Flujo de Registro de Asistencia**

```
Estudiante entra a /scan
  ↓
Inicia sesión en Firebase (o usa usuario autenticado)
  ↓
Sistema carga datos de Firebase automáticamente
  ↓
Estudiante ve sus datos pre-llenados
  ↓
Estudiante escanea QR del docente
  ↓
POST a /api/sessions/{sessionId}/attendance
  {
    studentId: "123456789",
    studentName: "Juan Pérez",
    studentEmail: "juan@email.com",
    studentPhone: "+57 300 123 4567"
  }
  ↓
Datos se guardan en Firebase asincronamente
```

## Ventajas del Nuevo Sistema

✅ **Datos Reales**: No depende de localStorage
✅ **Sincronización**: Datos siempre actualizados desde Firebase
✅ **Seguridad**: Datos autenticados por usuario Firebase
✅ **Multi-dispositivo**: Si el estudiante usa otro dispositivo, sus datos se cargan automáticamente
✅ **Consistencia**: Los datos en la BD siempre son consistentes

## Cómo Verificar en Render

1. Abre `/scan` en Render
2. Abre la consola (F12)
3. Busca logs:
   - "Firebase inicializado correctamente"
   - "Cargando datos de Firebase para usuario: {uid}"
   - "Datos cargados de Firebase:"

Si ves esos logs, el sistema está funcionando correctamente.

## Autenticación Requerida

El formulario de `scan.html` ahora intenta:
1. **Primero**: Obtener datos del usuario autenticado en Firebase
2. **Si falla**: Muestra formulario vacío para ingreso manual

Asegúrate que los estudiantes estén autenticados en Firebase antes de usar `/scan`.

## Estructura de Autenticación Esperada

En tu app, asume que los estudiantes han iniciado sesión así:
```javascript
firebase.auth().signInWithEmailAndPassword(email, password)
```

O que ya tienen una sesión activa de Firebase.
