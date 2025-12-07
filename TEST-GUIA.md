# 📋 Guía de Testing - Sistema de Asistencia por QR

## ✅ Verificación Paso a Paso

### Requisitos
- Navegador moderno con soporte para cámara web
- 2 dispositivos (o ventanas) para simular docente y estudiante
- Conexión a internet (Render)

---

## 🧪 Test 1: Autenticación del Docente

### Paso 1.1: Acceder a la aplicación
```
URL: https://poryectojiji.onrender.com/
Esperado: Página de login del docente
```

### Paso 1.2: Registrarse o Login
```
Si es nuevo:
1. Click en "Regístrate aquí"
2. Ingresa email y contraseña
3. Click "Registrarse"

Si ya existe:
1. Ingresa email y contraseña
2. Click "Iniciar Sesión"

Esperado: Redirect al dashboard
```

### ✅ Resultado Esperado
- Se muestra el panel del docente
- Véase: "Bienvenido [email]"
- Sección de cursos visible

---

## 🧪 Test 2: Crear Curso (Opcional)

### Paso 2.1: Crear un nuevo curso
```
1. En el dashboard, busca "Agregar Curso"
2. Ingresa:
   - Nombre: "Algoritmos Avanzados"
   - Código: "ALG-201"
   - Descripción: "Curso de estructuras de datos"
   - Instructor: Tu nombre
   - Salón: "A101"
3. Click "Agregar Curso"

Esperado: El curso aparece en la lista
```

---

## 🧪 Test 3: Generar QR (Docente)

### Paso 3.1: Acceder a generador de QR
```
URL: https://poryectojiji.onrender.com/student
O
Click en "Generar Sesión QR" del dashboard

Esperado: Página de generación de sesión
```

### Paso 3.2: Crear sesión
```
1. Selecciona un curso del dropdown
   - Los campos se llenan automáticamente
2. Verifica:
   - Nombre del Curso está lleno
   - ID del Curso está lleno
   - Tu ID está lleno
   - Tu Nombre está lleno
3. Click "Generar Sesión QR"

Observa los logs:
- "📤 Enviando request a /api/sessions con datos:"
- "✅ Datos de sesión recibidos:"
```

### ✅ Resultado Esperado
- Aparece un código QR en la pantalla
- Se muestra:
  - ID Sesión: [UUID]
  - Curso: [Nombre del curso]
  - Alumnos presentes: 0
  - URL en formato: https://poryectojiji.onrender.com/scan?sessionId=...
- Estado: "✅ Sesión creada exitosamente"

### 🔍 Verificar en Firebase Console
```
Ir a: https://console.firebase.google.com/
Proyecto: app-z-9ad8d
Realtime Database → Data

Buscar: sessions/{sessionId}
Estructura esperada:
{
  "courseId": "DB-001",
  "courseName": "Bases de Datos",
  "teacherId": "PROF-...",
  "teacherName": "Tu nombre",
  "status": "active",
  "createdAt": "2025-12-07T...",
  "qrUrl": "https://...",
  "attendees": []
}
```

---

## 🧪 Test 4: Estudiante Accede a Escaneo

### Paso 4.1: Abrir página de escaneo
```
En OTRA ventana/dispositivo:

URL: https://poryectojiji.onrender.com/scan

Esperado:
- Titulo: "Marcar Asistencia"
- Formulario visible con campos:
  - Nombre Completo
  - Número de Identificación
  - Correo Electrónico
  - Teléfono
- Botón "Continuar"
```

### Paso 4.2: Ingresa datos del estudiante
```
Nombre: "Juan Pérez"
ID: "1234567890"
Email: "juan@example.com"
Teléfono: "+57 300 123 4567"

Click: "Continuar"

Observa los logs:
- "📋 Datos del formulario:"
- "✅ Variables globales establecidas:"
- "📷 Iniciando sección de escaneo..."
- "🎥 Llamando a initializeCamera()"
```

### ✅ Resultado Esperado
- Se oculta el formulario
- Aparece sección "Marcar Asistencia"
- Se solicita permiso de cámara
- Estado: "📷 Buscando código QR..."
- Se ve video de la cámara

### 🔍 Verificar en Consola (F12)
```
Logs esperados:
========== INICIALIZANDO CÁMARA ==========
🔍 Verificando librería html5-qrcode...
✅ Html5Qrcode cargado exitosamente
========== INICIANDO ESCANEO QR ==========
🔧 Creando instancia de Html5Qrcode...
🎥 Iniciando cámara con configuración:
========== ESCANEO INICIADO ==========
```

---

## 🧪 Test 5: Escanear el QR

### Paso 5.1: Preparar para escaneo
```
En la ventana del docente:
- QR debe estar visible en pantalla

En la ventana del estudiante:
- Cámara debe estar activa
- Estado dice: "📷 Buscando código QR..."
```

### Paso 5.2: Escanear
```
Desde el dispositivo/ventana del estudiante:
1. Apunta la cámara al QR del docente
2. Espera a que se detecte

Observa en consola:
- "🎉 ¡¡QR DETECTADO!!"
- "📱 Contenido del QR: https://..."
- "========== PROCESANDO DATOS DEL QR =========="
- "📊 Datos crudos del QR: https://..."
- "🌐 Detectado como URL absoluta"
- "✅ SessionId extraído de URL absoluta: [UUID]"
- "========== PROCESAMIENTO COMPLETADO =========="
```

### ✅ Resultado Esperado
- Escaneo se pausa automáticamente
- Estado cambia a: "Registrando asistencia..."

---

## 🧪 Test 6: Registro de Asistencia

### Paso 6.1: Verificar request al servidor
```
En consola del navegador (Tab Network):

Request:
POST /api/sessions/{sessionId}/attendance
Headers: Content-Type: application/json
Body: {
  "studentId": "1234567890",
  "studentName": "Juan Pérez",
  "studentEmail": "juan@example.com",
  "studentPhone": "+57 300 123 4567"
}

Status: 201 Created
```

### ✅ Resultado Esperado EN ESTUDIANTE
```
Estado: "✅ ¡Asistencia registrada exitosamente!"
Muestra:
- Nombre: Juan Pérez
- ID/Documento: 1234567890
- Sesión: [ID corto]
- Botón "Volver al Inicio"

Sonido de éxito (si el dispositivo lo permite)

Logs en consola:
========== INICIANDO REGISTRO DE ASISTENCIA ==========
📍 SessionId: [UUID]
👤 Datos del estudiante: { ... }
📤 Datos a enviar al servidor: { ... }
🔗 URL de endpoint: /api/sessions/{sessionId}/attendance
📨 Respuesta del servidor: { status: 201, statusText: 'Created' }
✅ ASISTENCIA REGISTRADA EXITOSAMENTE
========== REGISTRO COMPLETADO ==========
```

---

## 🧪 Test 7: Verificar en Dashboard del Docente

### Paso 7.1: Actualizar lista de asistencia
```
En la ventana del docente (/student):
1. Observa "Alumnos presentes: 0" inicialmente
2. Click en "Actualizar Lista"

Esperado: 
- "Alumnos presentes: 1"
- Aparece "Juan Pérez" en la lista
- Hora de escaneo mostrada
```

### Paso 7.2: Verificar en Firebase
```
Firebase Console → Realtime Database → Data

Estructura guardada:
sessions/{sessionId}/attendees/
├─ 1234567890: {
│  "studentId": "1234567890",
│  "studentName": "Juan Pérez",
│  "studentEmail": "juan@example.com",
│  "studentPhone": "+57 300 123 4567",
│  "markedAt": "2025-12-07T14:30:00.000Z"
│ }
```

---

## 🧪 Test 8: Verificar en Dashboard Principal

### Paso 8.1: Ir al dashboard principal
```
URL: https://poryectojiji.onrender.com/
O
Click "Volver" desde /student

Esperado:
- Dashboard muestra la asistencia del día
- Sección "Asistencia" visible
- "Juan Pérez" aparece en la lista
```

### Paso 8.2: Filtrar por fecha (Opcional)
```
Si hay selector de fecha:
1. Selecciona la fecha de hoy
2. Verifica que "Juan Pérez" aparece

Esperado: Asistencia filtrada correctamente
```

---

## 🧪 Test 9: Prueba con Múltiples Estudiantes

### Paso 9.1: Repetir escaneo con otro estudiante
```
Abre OTRA ventana/dispositivo con /scan

Datos:
Nombre: "María González"
ID: "0987654321"
Email: "maria@example.com"
Teléfono: "+57 300 987 6543"

Escanea el mismo QR

Esperado: Se registra la segunda asistencia
```

### Paso 9.2: Verificar en docente
```
Click "Actualizar Lista"

Esperado:
- "Alumnos presentes: 2"
- Ambos estudiantes en la lista
```

---

## 🧪 Test 10: Cerrar Sesión

### Paso 10.1: Cerrar sesión desde docente
```
En /student:
1. Click botón "Cerrar Sesión"

Observa en consola:
- PATCH /api/sessions/{sessionId}/close
- "Sesión cerrada"

Esperado:
- QR desaparece
- Status cambio a "inactive"
- No se aceptan nuevas asistencias
```

### Paso 10.2: Intentar escanear con sesión cerrada
```
En ventana del estudiante:
Abre /scan y escanea

Esperado: 
- Error: "This session is no longer active"
- O mensaje similar indicando sesión cerrada
```

---

## 🔧 Troubleshooting

### Problema: "Error: librería QR no cargada"
```
Solución:
1. Presiona F5 para recargar la página
2. Espera 2-3 segundos
3. Los logs deben mostrar:
   "✅ Html5Qrcode cargado exitosamente"
```

### Problema: Cámara no se enciende
```
Solución:
1. Verifica permisos en navegador
   Chrome: ⋮ → Configuración → Privacidad → Permisos → Cámara
2. Asegúrate que no hay otra app usando la cámara
3. Recarga la página
4. Click "Permitir" cuando pida acceso a cámara
```

### Problema: QR no se detecta
```
Solución:
1. Verifica que el QR sea visible y nítido
2. Apunta directamente la cámara al QR
3. Evita cambios de luz rápidos
4. Acerca más la cámara
5. Verifica en consola:
   "🎉 ¡¡QR DETECTADO!!" debe aparecer
```

### Problema: "SessionId no encontrado"
```
Solución:
1. Verifica que el QR contenga una URL válida
2. Mira los logs:
   "📊 Datos crudos del QR: ..."
3. Debe contener: "sessionId=..."
```

### Problema: "Session not found"
```
Solución:
1. Verifica que la sesión fue creada en Firebase
2. Comprueba el sessionId en la URL del QR
3. Intenta generar una sesión nueva
```

---

## 📊 Checklist de Verificación Final

```
✅ DOCENTE
 ├─ ✓ Login funciona
 ├─ ✓ Dashboard se carga
 ├─ ✓ Puede crear/editar cursos
 ├─ ✓ Genera QR exitosamente
 ├─ ✓ QR se muestra en pantalla
 ├─ ✓ Sesión se crea en Firebase
 ├─ ✓ Ve asistentes en tiempo real
 └─ ✓ Puede cerrar sesión

✅ ESTUDIANTE
 ├─ ✓ Página /scan se carga
 ├─ ✓ Formulario funciona
 ├─ ✓ Cámara se enciende
 ├─ ✓ QR se detecta
 ├─ ✓ Escaneo se pausa
 ├─ ✓ Envía datos al servidor
 ├─ ✓ Ve confirmación de éxito
 └─ ✓ Datos se guardan en Firebase

✅ FIREBASE
 ├─ ✓ Sesión se crea
 ├─ ✓ Asistencia se registra
 ├─ ✓ Estudiante se guarda
 ├─ ✓ Datos están en rutas correctas
 └─ ✓ Listeners funcionan

✅ BACKEND
 ├─ ✓ Endpoint POST /api/sessions
 ├─ ✓ Endpoint POST /api/sessions/:id/attendance
 ├─ ✓ Generación de UUID
 ├─ ✓ Generación de QR
 ├─ ✓ Respuesta 201
 └─ ✓ Guardado async en Firebase

✅ CONECTIVIDAD
 ├─ ✓ Frontend conecta a backend
 ├─ ✓ Backend conecta a Firebase
 ├─ ✓ Render deploy funciona
 └─ ✓ RENDER_EXTERNAL_URL configurado
```

---

## 🎯 Conclusión

Si todas las pruebas pasan, el sistema está **100% FUNCIONAL** y **CORRECTAMENTE CONECTADO**.

¡Felicidades! 🎉
