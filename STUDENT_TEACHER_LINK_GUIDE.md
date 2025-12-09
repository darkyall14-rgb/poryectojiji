# Guía de Enlace Estudiante-Docente

## 📚 ¿Qué es el enlace Estudiante-Docente?

El enlace estudiante-docente permite que:
- ✅ El estudiante se asocie con su docente
- ✅ El docente pueda registrar la asistencia del estudiante
- ✅ El sistema sepa a qué docente pertenece cada estudiante
- ✅ Se valide correctamente cuando el estudiante escanea un código QR del docente

## 🔗 Cómo Enlazar un Estudiante con un Docente

### Opción 1: Desde el Perfil del Estudiante (Recomendado)

1. **Accede a tu perfil**
   - Abre la página del estudiante (`student.html`)
   - Haz clic en tu avatar o nombre en la esquina superior derecha
   - Selecciona "Mi Perfil"

2. **En el modal de perfil, busca "Docente Asignado"**
   - Verás un campo que muestra:
     - "Sin docente asignado" (si no tienes uno)
     - El nombre del docente (si ya estás enlazado)

3. **Haz clic en el botón "Enlazar"**
   - Se abrirá un modal con la lista de todos los docentes disponibles
   - Podrás buscar por nombre o correo en la barra de búsqueda

4. **Selecciona tu docente**
   - Haz clic en el botón "Enlazar" en la tarjeta del docente
   - El sistema confirmará el enlace

5. **Cierra el modal**
   - El perfil se actualizará y mostrará el nombre de tu docente

### Opción 2: Durante el Registro Manual de Asistencia

Cuando registras asistencia manualmente:
1. Ve a la sección de asistencia
2. Haz clic en "Registrar Asistencia Manual"
3. En el campo de "Docente", busca y selecciona tu docente

## 📋 Estructura de Datos

Cuando un estudiante se enlaza con un docente, se guarda:

```json
{
  "studentId": "abc123",
  "teacherId": "xyz789",
  "linkedAt": "2025-12-08T22:08:00Z"
}
```

En Firebase:
```
students/
  └── {studentId}/
      ├── names: "Juan"
      ├── lastnames: "Pérez"
      ├── email: "juan@ejemplo.com"
      ├── teacherId: "xyz789"    // ← Se guarda aquí
      ├── linkedAt: 1733707680000
      └── ...
```

## 🎯 Casos de Uso

### Caso 1: Estudiante sin Docente
```
Estado: "Sin docente asignado"
Acción: Haz clic en "Enlazar" y selecciona tu docente
Resultado: El campo se actualiza con el nombre del docente
```

### Caso 2: Estudiante ya enlazado
```
Estado: Muestra el nombre del docente actual
Acción: Haz clic en "Enlazar" para cambiar de docente
Resultado: Se reemplaza el teacherId anterior por el nuevo
```

### Caso 3: Escanear QR después de enlazar
```
1. Estudiante escanea código QR del docente X
2. Sistema verifica que teacherId = X
3. Si coincide → ✅ Asistencia registrada
4. Si no coincide → ❌ Error "No corresponde a tu docente"
```

## 🔒 Validaciones

El sistema valida automáticamente:

| Validación | Resultado |
|-----------|-----------|
| Estudiante sin teacherId + QR válido | ✅ Permite marcar |
| Estudiante con teacherId = A + QR de A | ✅ Permite marcar |
| Estudiante con teacherId = A + QR de B | ❌ Rechaza (no coincide) |
| Estudiante sin datos en BD | ❌ Rechaza (no registrado) |

## 🐛 Solución de Problemas

### Problema: "No aparece el botón Enlazar"
- **Causa**: No estás logged in como estudiante
- **Solución**: Asegúrate de estar autenticado como estudiante

### Problema: "La lista de docentes está vacía"
- **Causa**: No hay docentes registrados en el sistema
- **Solución**: El administrador debe crear al menos un docente primero

### Problema: "El enlace se revierte"
- **Causa**: Otra parte del código está sobrescribiendo el teacherId
- **Solución**: Abre la consola (F12) y busca errores `[ERROR]`

### Problema: "Al escanear QR dice 'no coincide'"
- **Causa 1**: No estás enlazado con el docente que generó el QR
  - **Solución**: Enlázate con el docente correcto
- **Causa 2**: El sistema no encontró tu registro de estudiante
  - **Solución**: Pídele al docente que te agregue primero

## 💡 Tips

✅ **Usa la búsqueda** para encontrar rápidamente tu docente por nombre o email

✅ **Ten actualizado tu perfil** - Asegúrate que tus nombres estén correctos

✅ **Si cambias de docente** - Simplemente haz clic en "Enlazar" de nuevo

✅ **Verifica en la consola** - Si algo no funciona, abre F12 y busca `[DEBUG]` o `[ERROR]`

## 📱 Flujo Completo

```
1. Estudiante abre su perfil
   ↓
2. Ve "Sin docente asignado"
   ↓
3. Hace clic en "Enlazar"
   ↓
4. Se abre modal con lista de docentes
   ↓
5. Selecciona su docente
   ↓
6. Sistema actualiza Firebase con teacherId
   ↓
7. Modal se cierra
   ↓
8. Perfil muestra el nombre del docente
   ↓
9. Cuando escanea QR, el sistema valida que coincida
   ↓
10. Asistencia se registra correctamente ✅
```

## 📊 Información en Firebase

Para verificar que el enlace se guardó:

**Ruta**: `students/{studentId}/teacherId`

Debería ver el UID del docente, ejemplo:
```
students/
  ├── abc123/
  │   └── teacherId: "xyz789"
  ├── def456/
  │   └── teacherId: "xyz789"
  └── ...
```

## 🔄 Sincronización de Datos

Después de enlazar, el sistema:
1. ✅ Guarda el `teacherId` en la BD
2. ✅ Actualiza la variable `studentData` en memoria
3. ✅ Actualiza el campo del perfil en la UI
4. ✅ Valida automáticamente en el siguiente QR scan

## ⚙️ Para Docentes

Como docente, puedes verificar si un estudiante está enlazado:

1. Ve a **Estudiantes** en tu dashboard
2. Busca al estudiante
3. Verifica que su `teacherId` coincida con tu UID
4. Si no está enlazado, puedes:
   - Crear un nuevo estudiante (que se enlazará automáticamente)
   - O decirle al estudiante que se enlace desde su perfil
