# 🔄 Flujo Completo de Escaneo y Registro de Asistencia

## Arquitectura de 3 Capas Conectadas

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUJO COMPLETO DEL SISTEMA                  │
└─────────────────────────────────────────────────────────────────┘

1️⃣  CAPA DOCENTE (index.html / student.html)
   ├─ Panel docente - Dashboard
   ├─ Gestión de cursos y estudiantes
   └─ Generación de QR y sesiones

2️⃣  CAPA ESTUDIANTE (scan.html)
   ├─ Ingreso de datos del estudiante
   ├─ Escaneo del QR
   └─ Confirmación de asistencia

3️⃣  CAPA DE BACKEND Y BASE DE DATOS (Firebase)
   ├─ Registro de sesiones activas
   ├─ Almacenamiento de asistencia
   └─ Sincronización en tiempo real
```

---

## 📋 Pasos del Flujo

### PASO 1: Docente crea una sesión (student.html)
```
┌────────────────────────────────┐
│ 1. Docente login (index.html)  │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 2. Accede a /student           │
│    - Selecciona curso          │
│    - Ingresa datos             │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 3. Click en "Generar Sesión"   │
│    generateNewSession()        │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 4. POST /api/sessions          │
│    ├─ courseId                 │
│    ├─ courseName               │
│    ├─ teacherId                │
│    └─ teacherName              │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 5. Backend (sessionController) │
│    ├─ Crea sessionId (UUID)    │
│    ├─ Genera URL: https://... /│
│    │   scan?sessionId=xxx      │
│    ├─ Genera QR de esa URL     │
│    └─ Guarda en Firebase       │
│        sessions/{sessionId}    │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 6. Respuesta al docente        │
│    ├─ sessionId                │
│    ├─ qrUrl                    │
│    └─ Muestra QR en pantalla   │
└────────────────────────────────┘
```

---

### PASO 2: Estudiante escanea el QR (scan.html)
```
┌────────────────────────────────┐
│ 1. Estudiante accede /scan     │
│    (puede ser vía link)        │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 2. Ingresa datos:              │
│    ├─ Nombre                   │
│    ├─ ID/Documento             │
│    ├─ Email                    │
│    └─ Teléfono                 │
│    Click: "Continuar"          │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 3. saveStudentDataAndStart()   │
│    ├─ Valida campos            │
│    ├─ Guarda en variables      │
│    ├─ Guarda en Firebase       │
│    │   students/{userId}       │
│    └─ Inicia cámara            │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 4. initializeCamera()          │
│    ├─ Espera html5-qrcode      │
│    ├─ Solicita permiso cámara  │
│    └─ Inicia escaneo           │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 5. 📱 ESCANEA EL QR 📱         │
│    ├─ QR contiene URL:         │
│    │   https://...onrender./   │
│    │   scan?sessionId=xxxx     │
│    └─ html5-qrcode lo detecta  │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 6. processQRData(qrData)       │
│    ├─ Extrae sessionId         │
│    │   de la URL               │
│    └─ Valida que sea UUID      │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 7. registerAttendance()        │
│    ├─ POST /api/sessions/      │
│    │   {sessionId}/attendance  │
│    ├─ Envía:                   │
│    │   - studentId             │
│    │   - studentName           │
│    │   - studentEmail          │
│    │   - studentPhone          │
│    └─ Espera respuesta         │
└────────────┬───────────────────┘
             │
             ▼
┌────────────────────────────────┐
│ 8. ✅ Muestra notificación     │
│    "Asistencia registrada      │
│     exitosamente"              │
└────────────────────────────────┘
```

---

### PASO 3: Backend registra en Firebase
```
┌─────────────────────────────────────┐
│ sessionController.markAttendance()  │
└────────┬──────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 1. Valida sessionId y studentId     │
│ 2. Busca sesión en Firebase:        │
│    sessions/{sessionId}             │
│ 3. Verifica que esté activa         │
│ 4. Verifica que no esté duplicado   │
└────────┬──────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 5. Responde INMEDIATAMENTE al      │
│    cliente con 201 Created          │
│    (no bloquea el registro)         │
└────────┬──────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ 6. Guarda en Firebase ASYNC:        │
│                                     │
│  a) sessions/{sessionId}/           │
│     attendees/{studentId}           │
│                                     │
│  b) sessions/{sessionId}/           │
│     attendees (array actualizado)   │
│                                     │
│  c) attendance/{timestamp}          │
│     _{sessionId}_{studentId}        │
│                                     │
│  d) teachers/{teacherId}/           │
│     attendance/{timestamp}          │
│                                     │
│  e) students/{studentId}            │
│     (crea o actualiza estudiante)   │
└────────┬──────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ FIREBASE REALTIME DATABASE          │
│                                     │
│ ✅ Datos guardados                 │
│ ✅ Listeners en tiempo real         │
│ ✅ Dashboard se actualiza           │
└─────────────────────────────────────┘
```

---

## 🔗 Conexiones Entre Archivos

### HTML Files (Vistas)
```
index.html (Dashboard Docente)
├─ Login y autenticación
├─ Gestión de cursos
├─ Gestión de estudiantes
└─ Muestra asistencia del día

student.html (Generador de QR)
├─ Crea nuevas sesiones
├─ Genera QR
├─ Muestra asistentes en tiempo real
└─ Cierra sesiones

scan.html (Escaneo Estudiante)
├─ Formulario de datos
├─ html5-qrcode para escaneo
├─ Envía asistencia al backend
└─ Confirmación de registro
```

### Backend (Node.js)
```
routes/
├─ viewRoutes.js
│  ├─ GET /        → index.html
│  ├─ GET /student → student.html
│  └─ GET /scan    → scan.html
│
└─ apiRoutes.js
   ├─ POST /sessions              → Crea sesión
   ├─ POST /sessions/:id/attendance → Registra asistencia
   ├─ GET /sessions/:id           → Obtiene sesión
   ├─ GET /attendance             → Lista asistencia
   └─ [...otros endpoints]
```

### Controllers
```
sessionController.js
├─ createSession()      → Genera QR y sesión
└─ markAttendance()     → Registra estudiante en sesión

studentController.js
├─ create()             → Crea estudiante
├─ getAll()             → Lista estudiantes
└─ delete()             → Elimina estudiante

courseController.js
├─ create()             → Crea curso
├─ getAll()             → Lista cursos
└─ delete()             → Elimina curso

attendanceController.js
├─ create()             → Registra asistencia
└─ getAll()             → Lista asistencia
```

### Frontend (JavaScript)
```
script.js (Dashboard)
├─ handleLogin()        → Autentica docente
├─ handleAddCourse()    → Crea curso via API
├─ handleAddStudent()   → Crea estudiante via API
├─ loadAttendanceRecords() → Obtiene asistencia
├─ watchAttendanceUpdates()→ Escucha cambios Firebase
└─ [...otras funciones]

student.html (embed script)
├─ generateNewSession() → POST /api/sessions
├─ displayQR()         → Muestra QR en pantalla
├─ refreshAttendance() → Actualiza lista
└─ closeSession()      → Cierra sesión

scan.html (embed script)
├─ initializeCamera()  → Inicia html5-qrcode
├─ processQRData()     → Extrae sessionId
├─ registerAttendance()→ POST /api/sessions/.../attendance
└─ setStatus()         → Muestra notificaciones
```

### Firebase Realtime Database
```
/sessions/{sessionId}
├─ courseId
├─ courseName
├─ teacherId
├─ teacherName
├─ status: "active"
├─ createdAt
├─ qrUrl
└─ attendees: [
     {
       studentId,
       studentName,
       studentEmail,
       studentPhone,
       markedAt
     }
   ]

/attendance/{timestamp}_{sessionId}_{studentId}
├─ studentId
├─ studentName
├─ sessionId
├─ courseId
├─ courseName
├─ teacherId
└─ markedAt

/students/{studentId}
├─ name
├─ email
├─ phone
├─ dni
└─ lastScanAt

/teachers/{teacherId}/attendance/{timestamp}
├─ (mismo que /attendance)
```

---

## ✅ Verificación de Conexiones

### 1. Docente genera QR ✓
- [x] student.html tiene formulario
- [x] generateNewSession() existe
- [x] POST /api/sessions en apiRoutes.js
- [x] sessionController.createSession() existe
- [x] Genera UUID y QR
- [x] Guarda en Firebase sessions/{sessionId}

### 2. Estudiante escanea ✓
- [x] scan.html existe en /scan
- [x] Formulario de datos
- [x] html5-qrcode integrado
- [x] initializeCamera() configurado
- [x] processQRData() extrae sessionId

### 3. Asistencia se registra ✓
- [x] registerAttendance() llamado
- [x] POST /api/sessions/:id/attendance existe
- [x] sessionController.markAttendance() configurable
- [x] Valida y guarda en Firebase
- [x] Respuesta 201 al cliente
- [x] Guarda async en Firebase

### 4. Dashboard se actualiza ✓
- [x] script.js tiene watchAttendanceUpdates()
- [x] Firebase listeners configurados
- [x] Sincronización en tiempo real
- [x] Muestra asistentes en tiempo real

---

## 🚀 Cómo Usar el Sistema Completo

### Paso 1: Docente Genera QR
1. Ir a `https://poryectojiji.onrender.com/`
2. Login con credenciales
3. Click en "Generar Sesión QR" o ir a `/student`
4. Seleccionar curso
5. Click "Generar Sesión QR"
6. QR aparece en pantalla (o en `/student`)
7. Compartir QR con estudiantes

### Paso 2: Estudiante Escanea
1. Ir a `https://poryectojiji.onrender.com/scan`
2. Ingresar datos (nombre, ID, email, teléfono)
3. Click "Continuar"
4. Permitir acceso a cámara
5. Apuntar cámara al QR del docente
6. Esperar: "✅ Asistencia registrada exitosamente"

### Paso 3: Docente Ve Asistencia
1. El dashboard muestra asistentes en tiempo real
2. En `/student` muestra "Alumnos presentes: N"
3. Click "Actualizar Lista" para refrescar
4. Asistencia filtrada por fecha en dashboard

---

## 🔐 Integración Firebase

Todas las operaciones usan Firebase Realtime Database:

```javascript
// Escritura de sesión
database.ref('sessions/{sessionId}').set({ ... })

// Lectura de asistencia
database.ref('attendance').on('value', snapshot => { ... })

// Actualización de asistentes
database.ref('sessions/{sessionId}/attendees').update({ ... })
```

---

## 📊 Summary

| Componente | Estado | Conexión |
|-----------|--------|----------|
| Generación QR | ✅ Activo | student.html → API → Firebase |
| Escaneo QR | ✅ Activo | scan.html → html5-qrcode → API |
| Registro Asistencia | ✅ Activo | API → Firebase ASYNC |
| Dashboard | ✅ Activo | Firebase listeners → Real-time update |
| Base de Datos | ✅ Firebase Realtime | Sincronización en tiempo real |

**Conclusión: ✅ TODO ESTÁ CORRECTAMENTE CONECTADO**
