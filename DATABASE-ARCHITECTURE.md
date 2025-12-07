# 📊 Arquitectura de Base de Datos - Realtime Database

## Decisión Técnica

Este proyecto utiliza **Firebase Realtime Database** exclusivamente. NO usa Firestore ni localStorage para datos persistentes.

### ✅ Por qué Realtime Database

1. **Sincronización en Tiempo Real**
   - Cambios se propagan instantáneamente a todos los clientes
   - Perfecto para QR y asistencia en vivo

2. **Estructura JSON Simple**
   - Fácil de entender y debuggear
   - Menos overhead que Firestore
   - Mejor para datos estructurados

3. **Listeners en Vivo**
   - Dashboard se actualiza automáticamente
   - No requiere polling
   - Eficiente en conexiones

## Estructura de Datos

```
xanes-36606-default-rtdb
├── teachers/
│   ├── {uid}/
│   │   ├── uid: string
│   │   ├── name: string
│   │   ├── email: string
│   │   ├── institution: string
│   │   ├── students/
│   │   │   ├── {studentKey}/
│   │   │   │   ├── id: string
│   │   │   │   ├── name: string
│   │   │   │   ├── studentId: string
│   │   │   │   └── email: string
│   │   ├── courses/
│   │   │   ├── {courseKey}/
│   │   │   │   ├── id: string
│   │   │   │   ├── name: string
│   │   │   │   ├── code: string
│   │   │   │   ├── description: string
│   │   │   │   └── ...
│   │   └── attendance/
│   │       ├── {attendanceKey}/
│   │           ├── studentId: string
│   │           ├── courseId: string
│   │           └── timestamp: string
├── students/
│   ├── {studentId}/
│   │   ├── id: string
│   │   ├── name: string
│   │   ├── dni: string
│   │   ├── phone: string
│   │   └── lastScanAt: string
└── sessions/
    ├── {sessionId}/
    │   ├── sessionId: string
    │   ├── courseId: string
    │   ├── courseName: string
    │   ├── teacherId: string
    │   ├── teacherName: string
    │   ├── status: "active" | "closed"
    │   ├── qrUrl: string
    │   ├── createdAt: string
    │   └── attendees/
    │       ├── {index}/
    │           ├── studentId: string
    │           ├── studentName: string
    │           ├── studentEmail: string
    │           ├── markedAt: string
    │           └── ...
```

## Operaciones CRUD

### CREATE (Crear Datos)
```javascript
// Crear curso
const courseRef = database.ref('teachers/' + uid + '/courses').push();
await courseRef.set({
    id: courseRef.key,
    name: "Algoritmos",
    code: "ALGO-101",
    // ...
});
```

### READ (Leer Datos)
```javascript
// Lectura única
const snapshot = await database.ref('teachers/' + uid + '/courses').once('value');
const courses = snapshot.val();

// Listener en vivo
database.ref('sessions').on('value', (snapshot) => {
    const sessions = snapshot.val();
    // Actualizar UI
});
```

### UPDATE (Actualizar Datos)
```javascript
// Actualizar curso
await database.ref('teachers/' + uid + '/courses/' + courseId).update({
    name: "Nuevo Nombre",
    // ...
});
```

### DELETE (Eliminar Datos)
```javascript
// Eliminar curso
await database.ref('teachers/' + uid + '/courses/' + courseId).remove();
```

## Listeners en Vivo

### Escuchar Cambios en Tiempo Real
```javascript
// Dashboard de asistencia
database.ref('sessions').on('value', (snapshot) => {
    const sessions = snapshot.val();
    renderAttendance(sessions);
});

// Desuscribirse cuando sea necesario
database.ref('sessions').off();
```

### Escuchar Eventos Específicos
```javascript
// Nuevo registro de asistencia
database.ref('sessions').on('child_added', (snapshot) => {
    const newSession = snapshot.val();
    console.log('Nueva sesión:', newSession);
});

// Cambio en sesión existente
database.ref('sessions').on('child_changed', (snapshot) => {
    const updatedSession = snapshot.val();
    console.log('Sesión actualizada:', updatedSession);
});
```

## NO se Usa

### ❌ Firestore
- No hay `.collection()` ni `.doc()`
- No hay transacciones complejas de Firestore
- No hay índices de Firestore

### ❌ localStorage
- Solo se usa para UI temporal (temas, etc)
- Datos persistentes → SIEMPRE Realtime Database
- Sesiones → Firebase Auth (no localStorage)

### ❌ Datos en Memoria
- Todos los datos vienen de Firebase
- No hay caché local manual

## Ventajas de esta Arquitectura

✅ **Consistencia**: Un único source of truth (Firebase)
✅ **Tiempo Real**: Cambios inmediatos en todos los clientes
✅ **Escalabilidad**: Firebase maneja la escala automáticamente
✅ **Seguridad**: Control granular con Security Rules
✅ **Mantenibilidad**: Menos código, más simplicidad

## Security Rules

Todos los datos están protegidos por Security Rules en Firebase Console:

```json
{
  "rules": {
    "teachers": {
      "$uid": {
        ".read": "auth.uid === $uid",
        ".write": "auth.uid === $uid",
        "students": {
          ".read": "auth.uid === $parent/$uid",
          ".write": "auth.uid === $parent/$uid"
        },
        "courses": {
          ".read": "auth.uid === $parent/$uid",
          ".write": "auth.uid === $parent/$uid"
        }
      }
    },
    "sessions": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## Testing

### Verificar que NO hay localStorage
```javascript
// En la consola del navegador
Object.keys(localStorage) // No debe haber datos de asistencia
```

### Verificar que usa Realtime Database
```javascript
// Abre el DevTools → Network
// Busca conexión a: xanes-36606-default-rtdb.firebaseio.com
// Debe haber conexión WebSocket activa
```

### Verificar Listeners
```javascript
// En la consola
database.ref('sessions').on('value', (snapshot) => {
    console.log('✅ Datos en vivo:', snapshot.val());
});
```

## Documentación Oficial

- [Firebase Realtime Database](https://firebase.google.com/docs/database)
- [Realtime Database Queries](https://firebase.google.com/docs/database/web/query-data)
- [Realtime Database Security Rules](https://firebase.google.com/docs/database/security)
