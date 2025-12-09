# Reportes de Asistencia - Guía Completa

## 📊 Sistema de Reportes

El sistema ahora permite al docente **registrar y consultar la asistencia de múltiples formas** con reportes detallados.

## 🎯 Tres Métodos de Registro

### 1. **Escanear QR** 📱
- El docente genera un código QR
- Los estudiantes escanean para marcar su asistencia
- Se registra automáticamente la hora del escaneo
- Los registros se ven en tiempo real

**Información capturada:**
- ✓ Estudiante
- ✓ Ciclo
- ✓ Curso
- ✓ Hora (automática)
- ✓ Método: QR

### 2. **Registro Manual** ✏️
- El docente selecciona: Ciclo → Curso → Estudiante
- Elige el estado: Presente, Ausente, Tardío, Justificado
- Puede agregar observaciones
- Perfecto para casos especiales

**Información capturada:**
- ✓ Estudiante
- ✓ Ciclo
- ✓ Curso
- ✓ Hora (la actual)
- ✓ Método: Manual
- ✓ Observaciones

### 3. **Asistencia por Grupo** 👥
- Selecciona Ciclo → Curso → Fecha
- Marca estado para todos los estudiantes del grupo
- Rápido y eficiente para grupos completos

**Información capturada:**
- ✓ Todos los estudiantes del curso
- ✓ Ciclo
- ✓ Curso
- ✓ Fecha
- ✓ Método: Grupo

---

## 📈 Tres Tipos de Reportes

### **Reporte Diario** 📅
Consulta todos los registros de un día específico.

#### Cómo usarlo:
1. Ve a **Reportes** → **Diario**
2. Selecciona la fecha
3. Verás una tabla con:
   - Nombre del estudiante
   - Ciclo
   - Curso
   - Estado (✓ Presente, ✗ Ausente, ⏱ Tardío, ◯ Justificado)
   - Hora de registro
   - Método (QR, Manual, Grupo)

#### Ejemplo:
```
Fecha: 2024-12-08

| Estudiante    | Ciclo    | Curso        | Estado   | Hora   | Método |
|---------------|----------|--------------|----------|--------|--------|
| Juan Pérez    | 3 Ciclo  | Matemática   | ✓ Present| 08:15  | 📱 QR  |
| María García  | 3 Ciclo  | Matemática   | ⏱ Tardío | 08:45  | 📱 QR  |
| Carlos López  | 3 Ciclo  | Matemática   | ✗ Ausent | -      | ✏️ Man |
```

---

### **Reporte Mensual** 📊
Estadísticas completas del mes con porcentaje de asistencia.

#### Información mostrada:
- **Total de Registros**: Cuántos registros de asistencia hay
- **Promedio de Asistencia**: Porcentaje promedio de toda la clase
- **Estudiantes Activos**: Cuántos estudiantes tienen registros

#### Tabla detallada por estudiante:
- Nombre del estudiante
- Presentes (incluye tardíos y justificados)
- Tardíos
- Ausentes
- **Porcentaje de asistencia**

#### Código de colores:
- 🟢 **Verde** (≥80%): Excelente asistencia
- 🟡 **Amarillo** (60-79%): Asistencia regular
- 🔴 **Rojo** (<60%): Asistencia crítica

#### Ejemplo:
```
Mes: Diciembre 2024
Total Registros: 45
Promedio: 85%
Activos: 15 estudiantes

| Estudiante    | Presentes | Tardíos | Ausentes | % Asistencia |
|---------------|-----------|---------|----------|--------------|
| Juan Pérez    | 12        | 1       | 2        | 86%          |
| María García  | 10        | 3       | 2        | 81%          |
| Carlos López  | 7         | 1       | 7        | 53%          |
```

---

### **Reporte por Curso** 📚
Análisis detallado de asistencia por ciclo y curso.

#### Cómo usarlo:
1. Ve a **Reportes** → **Por Curso**
2. Filtra por:
   - **Ciclo** (opcional - todas si dejas en blanco)
   - **Curso** (opcional - todos si dejas en blanco)
3. Verás una tabla con todos los estudiantes

#### Información por estudiante:
- Nombre completo
- Ciclo
- Curso
- Total de clases registradas
- Clases asistidas (con asistencia válida)
- Porcentaje de asistencia

#### Ejemplo:
```
Ciclo: 3 Ciclo | Curso: Matemática

| Estudiante    | Ciclo   | Curso       | Total | Asistidas | % Asis |
|---------------|---------|-------------|-------|-----------|--------|
| Juan Pérez    | 3 Ciclo | Matemática  | 15    | 13        | 86%    |
| María García  | 3 Ciclo | Matemática  | 15    | 12        | 80%    |
| Carlos López  | 3 Ciclo | Matemática  | 15    | 8         | 53%    |
```

---

## 🔍 Datos Capturados en Cada Registro

### Siempre se captura:
1. **Estudiante** (nombre)
2. **ID Estudiante** (identificador único)
3. **Ciclo** (nivel academico)
4. **Curso** (materia o asignatura)
5. **Fecha** (fecha del registro)
6. **Hora** (hora exacta del registro)
7. **Estado** (presente, ausente, tardío, justificado)
8. **Método** (cómo se registró)
9. **Timestamp** (registro en Firebase)

### Información adicional (según el método):
- **QR**: Contiene ID del QR escaneado
- **Manual**: Puede incluir observaciones del docente
- **Grupo**: Indica que fue registro de grupo

---

## 📊 Estructura de Datos en Firebase

```
attendance/
  ├── 2024-12-08/
  │   ├── student_id_1/
  │   │   ├── studentName: "Juan Pérez"
  │   │   ├── cycle: "3 Ciclo"
  │   │   ├── course: "Matemática"
  │   │   ├── status: "present"
  │   │   ├── timestamp: "2024-12-08T08:15:00"
  │   │   ├── method: "qr"
  │   │   ├── qrId: "qr_abc123"
  │   │   └── teacherId: "teacher_uid"
  │   │
  │   └── student_id_2/
  │       ├── studentName: "María García"
  │       ├── cycle: "3 Ciclo"
  │       ├── course: "Matemática"
  │       ├── status: "late"
  │       ├── timestamp: "2024-12-08T08:45:00"
  │       ├── method: "qr"
  │       └── ...
  │
  └── 2024-12-09/
      └── ...
```

---

## ✨ Ventajas del Sistema

| Aspecto | Ventaja |
|---------|---------|
| **Múltiples métodos** | Flexibilidad en cómo registrar |
| **Registros automáticos** | QR lo hace en tiempo real |
| **Información detallada** | Hora, ciclo, curso, método |
| **Reportes dinámicos** | Consulta por día, mes o curso |
| **Estadísticas** | Porcentajes y promedios automáticos |
| **Trazabilidad** | Sabe cuándo y cómo se registró |
| **Filtros poderosos** | Por ciclo, curso, fecha |

---

## 🎯 Casos de Uso

### Caso 1: Monitoreo Diario
```
Mañana:
1. Genera QR para la clase
2. Los estudiantes escanean
3. En el reporte diario ves quién asistió y a qué hora
4. Si falta alguien, lo registras manualmente
```

### Caso 2: Revisión Mensual
```
Fin de mes:
1. Abres el reporte mensual
2. Ves quién tiene baja asistencia (< 80%)
3. Tomas acciones correctivas
4. Documentas el motivo en observaciones
```

### Caso 3: Análisis por Materia
```
Querés saber asistencia en Matemática:
1. Abres reportes por curso
2. Filtras: Ciclo = 3 Ciclo, Curso = Matemática
3. Ves cada estudiante y su porcentaje
4. Identificas a los que necesitan intervención
```

### Caso 4: Registro Rápido en Grupo
```
Toda la clase presente:
1. Usa "Asistencia por Grupo"
2. Selecciona Ciclo → Curso → Fecha
3. Marca todos como "Presente"
4. Guarda de una vez
```

---

## 📱 Métodos Comparados

| Característica | QR | Manual | Grupo |
|---|---|---|---|
| Velocidad | ⚡ Rápido | ⏱ Medio | ⚡ Rápido |
| Automatización | ✅ Sí | ❌ No | ❌ No |
| Hora automática | ✅ Sí | ❌ No | ❌ No |
| Flexibilidad | ❌ No | ✅ Sí | ⚠️ Solo grupos |
| Precisión | ✅ Alta | ✅ Alta | ✅ Alta |
| Observaciones | ❌ No | ✅ Sí | ❌ No |
| Ideal para | Clases normales | Casos especiales | Grupos completos |

---

## 🔧 Consejos Prácticos

✅ **Usa QR** para clases normales - es automático y rápido

✅ **Usa Manual** para:
- Estudiantes que llegan tarde
- Cambios de último minuto
- Justificaciones especiales
- Faltas con motivo

✅ **Usa Grupo** cuando:
- Todos asisten
- Faltan pocos (registra grupo, luego edita ausentes)

✅ **Revisa diario** al final del día para corregir errores

✅ **Analiza mensual** para identificar patrones

✅ **Usa reportes** para identificar estudiantes en riesgo

---

## 📌 Resumen

**El docente puede:**
- 📱 Generar QR para escaneo automático
- ✏️ Registrar manualmente cuando es necesario
- 👥 Marcar grupos completos rápidamente
- 📊 Ver reportes diarios, mensuales y por curso
- 🔍 Filtrar por ciclo, curso, fecha
- 📈 Analizar porcentajes de asistencia
- 💾 Todos los datos se guardan en Firebase con timestamp

**Información capturada siempre:**
- Estudiante, ciclo, curso
- Fecha y hora exacta
- Estado (presente, ausente, tardío, justificado)
- Método de registro (QR, manual, grupo)
- Observaciones (cuando aplica)
