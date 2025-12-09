# Guía: Ciclos y Cursos del Estudiante

## ¿Por qué no se cargan los ciclos y cursos?

El problema ocurría porque:

1. **Los campos eran readonly** - No permitían edición
2. **Los datos no se guardaban** - No había forma de actualizar cycle/course
3. **El sistema dependía de que estuvieran en studentData** - Si no estaban, no aparecían

## ✅ Soluciones Implementadas

### 1. **Campos Editables**
Los campos "Ciclo Actual" y "Curso Actual" ahora son editables:
- Antes: `readonly` (solo lectura)
- Ahora: Editable (puedes escribir directamente)

### 2. **Mejor Carga de Datos**
La función `populateProfileForm()` ahora:
- Busca `studentData.cycle` Y `studentData.ciclo` (ambas variantes)
- Busca `studentData.course` Y `studentData.curso` (ambas variantes)
- Loguea qué datos encontró para debug

### 3. **Guardado Automático**
La función `saveStudentProfile()` ahora:
- Guarda nombres, apellidos, ciclo Y curso
- Actualiza Firebase automáticamente
- Confirma con un mensaje de éxito

## 📚 Estructura de Datos en Firebase

Los ciclos y cursos se guardan así:

```json
{
  "students": {
    "abc123": {
      "id": "abc123",
      "names": "Juan",
      "lastnames": "Pérez",
      "cycle": "2025-1",           // ← Ahora se guarda aquí
      "course": "Web Development", // ← Ahora se guarda aquí
      "email": "juan@ejemplo.com",
      "teacherId": "xyz789",
      "linkedAt": 1733707680000
    }
  }
}
```

## 🎯 Cómo Usar

### Para el Estudiante:

1. **Abre tu perfil**
   - Haz clic en tu avatar en la esquina superior derecha
   - Selecciona "Mi Perfil"

2. **Edita tu ciclo y curso**
   - Los campos "Ciclo Actual" y "Curso Actual" ahora son editables
   - Escribe tu ciclo (ej: "2025-1", "2024-2")
   - Escribe tu curso (ej: "Web Development", "Matemáticas")

3. **Guarda los cambios**
   - Haz clic en "Guardar"
   - Verás un mensaje de confirmación
   - Los datos se guardaron en la base de datos

### Para el Docente (Crear Estudiante):

Cuando creas un estudiante, puedes incluir ciclo y curso:

```javascript
const payload = { 
  names: "Juan",
  lastnames: "Pérez",
  cycle: "2025-1",      // Puedes asignar aquí
  course: "Web Dev",    // Puedes asignar aquí
  teacherId: "xyz789"
};
```

## 🔍 Debug: Cómo Verificar los Datos

### Opción 1: Ver en la Consola
1. Abre F12 (Consola)
2. Abre tu perfil
3. Busca los logs:
   ```
   [DEBUG] Populating profile form with studentData: {
     cycle: "2025-1",
     course: "Web Development"
   }
   ```

### Opción 2: Revisar en Firebase
1. Abre Firebase Console
2. Realtime Database
3. Navega a: `students/{studentId}`
4. Busca los campos `cycle` y `course`

Debería verse así:
```
students/
  └── abc123/
      ├── names: "Juan"
      ├── cycle: "2025-1"        ← Aquí debe estar
      └── course: "Web Development" ← Aquí debe estar
```

## 🐛 Si Aún No Aparece

### Problema 1: El estudiante nunca fue creado con ciclo/curso
**Solución**: 
1. Abre tu perfil
2. Edita los campos de Ciclo y Curso
3. Haz clic en Guardar

### Problema 2: Los datos existen pero no aparecen
**Solución**:
1. Abre la consola (F12)
2. Busca `[DEBUG] Populating profile form`
3. Verifica si muestra los datos
4. Si no aparecen, el problema es que no están guardados en Firebase

### Problema 3: Edité pero no se guardó
**Solución**:
1. Abre la consola (F12)
2. Busca `[DEBUG] Saving student profile`
3. Busca `[SUCCESS] Student profile saved successfully`
4. Si ves `[ERROR]`, reporta el error

## 📋 Combinaciones Posibles

Estos son los campos que se pueden guardar:

| Campo | Tipo | Editable | Se Guarda |
|-------|------|----------|-----------|
| Nombres | Texto | ✅ | ✅ |
| Apellidos | Texto | ✅ | ✅ |
| Correo | Email | ❌ | ❌ |
| Ciclo | Texto | ✅ | ✅ |
| Curso | Texto | ✅ | ✅ |
| Docente | Selección | Vía botón "Enlazar" | ✅ |

## 📝 Ejemplo Completo

### Antes (sin nada):
```
Nombres: Juan
Apellidos: Pérez
Ciclo: (vacío)
Curso: (vacío)
Docente: Sin docente asignado
```

### Después de guardar:
```
Nombres: Juan
Apellidos: Pérez
Ciclo: 2025-1
Curso: Programación Web
Docente: María García
```

Y en Firebase se guarda automáticamente:
```json
{
  "students": {
    "abc123": {
      "names": "Juan",
      "lastnames": "Pérez",
      "cycle": "2025-1",
      "course": "Programación Web",
      "teacherId": "xyz789"
    }
  }
}
```

## ✨ Características Nuevas

✅ **Campos editables** - Escribe directamente ciclo y curso  
✅ **Guardado automático** - Los datos se guardan con un clic  
✅ **Validación** - No permite guardar sin nombres/apellidos  
✅ **Feedback visual** - Ves confirmación de guardado  
✅ **Logging detallado** - Console muestra qué pasa  
✅ **Fallback** - Busca tanto `cycle` como `ciclo`  

## 🎓 Casos de Uso

### Caso 1: Estudiante nuevo sin ciclo/curso
1. Estudiante se registra
2. Abre perfil
3. Escribe su ciclo y curso
4. Haz clic en Guardar
5. ✅ Datos guardados

### Caso 2: Cambiar de ciclo/curso
1. Abre perfil
2. Modifica los campos
3. Haz clic en Guardar
4. ✅ Datos actualizados

### Caso 3: Docente crea estudiante con ciclo/curso
1. Docente va a "Agregar Estudiante"
2. Llena: Nombre, Apellido, Ciclo, Curso
3. El sistema guarda automáticamente con esos datos
4. ✅ Estudiante aparece con ciclo y curso

## 📞 Resumen

Los ciclos y cursos ahora son:
- **Editables** - Puedes cambiarlos cuando quieras
- **Guardables** - Se persisten en la base de datos
- **Visibles** - Aparecen en el perfil del estudiante
- **Trackeable** - Puedes ver en Console qué sucede

Si algo no funciona, abre la consola (F12) y busca los logs `[DEBUG]` y `[ERROR]`.
