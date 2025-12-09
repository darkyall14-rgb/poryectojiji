# Guía de Debug - Validación de Código QR

## Problema
El estudiante intenta escanear el código QR creado por el docente pero el sistema marca "no coincide" o rechaza la asistencia.

## Soluciones Implementadas

### 1. **Logging Detallado Agregado**
Se agregaron múltiples `console.log` en puntos críticos para rastrear el flujo:

#### En `index.html` (Docente):
- **Línea ~3032**: Cuando se genera el QR, se loguea:
  ```
  [DEBUG] Saving QR code to database: {
    path: 'qr-codes/{teacherId}/{qrId}',
    data: {...}
  }
  ```
- Confirma que el QR se guardó correctamente en Firebase

#### En `student.html` (Estudiante):
- **Durante carga de datos del estudiante**:
  ```
  [DEBUG] Loading student data for user: {uid}
  [DEBUG] Total students in database: {count}
  [DEBUG] Checking student: {id, userId, email}
  [DEBUG] Student matched by userId: {id}
  ```

- **Durante procesamiento del QR**:
  ```
  [DEBUG] QR URL parameters: {teacherId, qrId}
  [DEBUG] Checking QR attendance eligibility: {...}
  [DEBUG] markAttendanceFromQR called with: {teacherId, qrId, studentData}
  [DEBUG] Validating QR code with ID: {qrId}
  [DEBUG] QR data from database: {...}
  ```

### 2. **Mejoras de Validación**

#### Validación de Student Data:
- Ahora busca por `userId` primero (más confiable)
- Luego intenta por `email`
- Incluye logging para cada intento

#### Validación de QR:
- Verifica que el QR exista en la BD antes de procesar
- Si no existe, muestra: "Este código QR no existe o ha sido eliminado"
- Verifica expiraciones correctamente
- Si el QR está expirado, muestra: "Este código QR ha expirado"

### 3. **Casos de Uso Soportados**

✅ **Estudiante SIN teacherId asignado**: Puede escanear QR de cualquier docente
✅ **Estudiante CON teacherId asignado**: Solo puede escanear QR de su docente
✅ **QR expirado**: Se rechaza con mensaje claro
✅ **QR no existe**: Se rechaza con mensaje claro

## Cómo Debuggear

### Paso 1: Abre la Consola del Navegador
**Docente:**
1. Abre `index.html` (dashboard del docente)
2. Presiona `F12` o `Ctrl+Shift+I`
3. Ve a la pestaña **Console**

**Estudiante:**
1. Abre `student.html`
2. Presiona `F12`
3. Ve a la pestaña **Console**

### Paso 2: Genera el Código QR
1. Como docente, ve a la sección **Asistencia** → **Generar QR de Clase**
2. Configura la fecha/hora y límite de tiempo si lo deseas
3. Haz clic en **Generar QR de Asistencia**
4. En la consola del docente, busca:
   ```
   [DEBUG] Saving QR code to database: ...
   [SUCCESS] QR code saved successfully with ID: ...
   ```

### Paso 3: Estudiante Escanea el QR
1. Como estudiante, abre la página (o escanea el código)
2. Verás en la consola:
   ```
   [DEBUG] Loading student data for user: ...
   [DEBUG] Student matched by userId: ...
   [DEBUG] QR URL parameters: {teacherId, qrId}
   [DEBUG] Checking QR attendance eligibility: ...
   [DEBUG] markAttendanceFromQR called with: ...
   [DEBUG] Validating QR code with ID: ...
   [DEBUG] QR data from database: {...}
   [SUCCESS] QR validation passed
   ```

### Paso 4: Identifica el Problema

#### Error: "No student data found"
```
[ERROR] No student data found
[WARN] No student data found for user: {uid}
```
**Solución**: El estudiante no está registrado en el sistema. Verifica que el docente haya creado el registro del estudiante.

#### Error: "QR teacherId mismatch"
```
[ERROR] QR teacherId mismatch: {
  studentTeacherId: "xyz123",
  qrTeacherId: "abc456"
}
```
**Solución**: El estudiante está asignado a otro docente. O el docente debe desasignar al estudiante, o el estudiante debe escanear el QR del docente correcto.

#### Error: "QR code not found in database"
```
[ERROR] QR code not found in database
```
**Solución**: El QR no se guardó correctamente. Intenta generar otro QR. Verifica que el docente esté autenticado.

#### Error: "QR expired"
```
[ERROR] QR expired at: 2025-12-08T22:30:00Z
```
**Solución**: Genera un nuevo QR con un límite de tiempo más largo o sin límite.

## Información de Firebase

### Estructura de almacenamiento del QR:
```
qr-codes/
  ├── {teacherId}/
      ├── {qrId}/
          ├── type: "student-panel"
          ├── teacherId: "..."
          ├── teacherName: "..."
          ├── timestamp: "2025-12-08T22:08:00Z"
          ├── qrId: "{qrId}"
          ├── validUntil: "2025-12-08T22:18:00Z" (opcional)
          ├── timeLimitMinutes: 10 (opcional)
          ├── url: "http://localhost/student.html?teacherId=...&qrId=..."
          ├── scanCount: 0
          ├── createdAt: 1733703120000
```

### Estructura de datos del estudiante:
```
students/
  ├── {studentId}/
      ├── names: "Juan"
      ├── lastnames: "Pérez"
      ├── userId: "auth_uid_123" (importante para matching)
      ├── email: "juan@ejemplo.com"
      ├── teacherId: "teacher_uid_456" (opcional)
      ├── course: "Web Development"
      ├── cycle: "2025-1"
```

## Checklist de Verificación

- [ ] El docente generó el QR
- [ ] En la consola del docente aparece `[SUCCESS] QR code saved successfully`
- [ ] El estudiante está registrado en el sistema (aparece en la lista de estudiantes del docente)
- [ ] El estudiante tiene un `userId` asignado
- [ ] Si el estudiante tiene `teacherId`, coincide con el del docente que genera el QR
- [ ] La fecha/hora actual está dentro del rango válido del QR
- [ ] El QR no ha expirado

## Contacto / Soporte
Si después de estos pasos sigue sin funcionar, revisa los logs en:
- Docente: `index.html` → Console → Busca `[DEBUG]` y `[ERROR]`
- Estudiante: `student.html` → Console → Busca `[DEBUG]` y `[ERROR]`
