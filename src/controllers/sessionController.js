const { v4: uuidv4 } = require('uuid');
const { createStudent, getStudentByStudentId, updateStudent, listStudents } = require("../models");
const { firebaseUtils } = require("../config/firebase");

// Path en Firebase para sesiones
const SESSIONS_PATH = "sessions";

// Función para construir la URL base correctamente en Render
function getBaseUrl(req) {
  // En Render, usar la variable de entorno RENDER_EXTERNAL_URL si está disponible
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  
  // En desarrollo local, construir desde req
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  
  // Filtrar localhost y direcciones locales si no estamos en desarrollo
  if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168')) {
    return `${protocol}://${host}`;
  }
  
  return `${protocol}://${host}`;
}

/**
 * Crear una nueva sesión QR para que los estudiantes escaneen
 * POST /api/sessions
 */
exports.createSession = async (req, res) => {
  const { courseId, courseName, teacherId, teacherName } = req.body;

  console.log('[createSession] Recibida solicitud:', { courseId, courseName, teacherId, teacherName });

  if (!courseId || !teacherId) {
    console.log('[createSession] Validacion fallida: courseId o teacherId faltante');
    return res.status(400).json({
      message: "courseId and teacherId are required",
    });
  }

  const sessionId = require('uuid').v4();
  const baseUrl = getBaseUrl(req);
  const qrUrl = `${baseUrl}/scan?sessionId=${sessionId}`;

  const session = {
    sessionId,
    courseId,
    courseName,
    teacherId,
    teacherName,
    qrUrl,
    createdAt: new Date().toISOString(),
    status: 'active',
    attendees: [],
  };

  try {
    console.log('[createSession] Guardando sesion en Firebase:', sessionId);
    console.log('[createSession] QR URL:', qrUrl);
    
    // Responder inmediatamente al cliente
    res.status(201).json({
      sessionId,
      qrUrl,
      message: "Session created successfully. Share this QR code with students.",
    });
    
    // Guardar en Firebase de forma asincrónica (sin bloquear la respuesta)
    firebaseUtils.write(`${SESSIONS_PATH}/${sessionId}`, session)
      .then(() => {
        console.log(`[createSession] Session guardada en Firebase: ${sessionId}`);
      })
      .catch((error) => {
        console.error("[createSession] Error saving session to Firebase:", error.message);
      });
      
  } catch (error) {
    console.error("[createSession] Error en createSession:", error.message);
    return res.status(500).json({
      message: "Error creating session: " + error.message,
    });
  }
};

/**
 * Obtener una sesión por ID
 * GET /api/sessions/:sessionId
 */
exports.getSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await firebaseUtils.readOnce(`${SESSIONS_PATH}/${sessionId}`);
    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }
    res.json(session);
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({
      message: "Error getting session",
    });
  }
};

/**
 * Listar todas las sesiones activas
 * GET /api/sessions
 */
exports.listSessions = async (req, res) => {
  try {
    const allSessionsData = await firebaseUtils.readOnce(SESSIONS_PATH);
    if (!allSessionsData) {
      return res.json([]);
    }
    // Retornar todas las sesiones (tanto activas como cerradas) para poder ver historial
    const allSessions = Object.values(allSessionsData).map(s => ({
      ...s,
      id: s.sessionId // Asegurar que tenga id
    }));
    res.json(allSessions);
  } catch (error) {
    console.error("Error listing sessions:", error);
    res.status(500).json({
      message: "Error listing sessions",
    });
  }
};

/**
 * Cerrar una sesión (detener de aceptar asistencias)
 * PATCH /api/sessions/:sessionId/close
 */
exports.closeSession = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await firebaseUtils.readOnce(`${SESSIONS_PATH}/${sessionId}`);
    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    session.status = 'closed';
    session.closedAt = new Date().toISOString();

    await firebaseUtils.update(`${SESSIONS_PATH}/${sessionId}`, {
      status: 'closed',
      closedAt: session.closedAt
    });

    res.json({
      message: "Session closed successfully",
      session,
    });
  } catch (error) {
    console.error("Error closing session:", error);
    res.status(500).json({
      message: "Error closing session",
    });
  }
};

/**
 * Marcar asistencia en una sesión (desde el escaneo QR)
 * POST /api/sessions/:sessionId/attendance
 */
exports.markAttendance = async (req, res) => {
  const { sessionId } = req.params;
  const { studentId, studentName, studentEmail, studentPhone } = req.body;

  console.log('[markAttendance] Solicitud recibida:', {
    sessionId,
    studentId,
    studentName,
    studentEmail,
    studentPhone,
  });

  if (!sessionId) {
    console.log('[markAttendance] Error: sessionId no proporcionado');
    return res.status(400).json({
      message: "sessionId is required",
    });
  }

  if (!studentId && !studentName) {
    console.log('[markAttendance] Error: studentId o studentName no proporcionados');
    return res.status(400).json({
      message: "studentId or studentName is required",
    });
  }

  try {
    console.log('[markAttendance] Buscando sesión en Firebase:', sessionId);
    const session = await firebaseUtils.readOnce(`${SESSIONS_PATH}/${sessionId}`);
    if (!session) {
      console.log('[markAttendance] Error: Sesión no encontrada:', sessionId);
      return res.status(404).json({
        message: "Session not found",
      });
    }

    console.log('[markAttendance] Sesión encontrada:', session.courseName);

    if (session.status !== 'active') {
      console.log('[markAttendance] Error: Sesión no está activa');
      return res.status(400).json({
        message: "This session is no longer active",
      });
    }

    // Verificar que no esté duplicado
    const attendees = session.attendees || [];
    const exists = attendees.some(
      (a) => a.studentId === studentId
    );

    if (exists) {
      console.log('[markAttendance] Error: Estudiante ya marcado en esta sesión');
      return res.status(400).json({
        message: "Student already marked as present in this session",
      });
    }

    const attendance = {
      studentId,
      studentName,
      studentEmail: studentEmail || null,
      studentPhone: studentPhone || null,
      markedAt: new Date().toISOString(),
    };

    // Agregar a la lista de asistentes (usar la variable local)
    const updatedAttendees = [...attendees, attendance];

    console.log('[markAttendance] Preparado para guardar asistencia');
    
    // Responder inmediatamente al cliente
    res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });

    // Guardar en Firebase de forma asincrónica (sin bloquear la respuesta)
    (async () => {
      try {
        console.log('[markAttendance] Iniciando guardado asincrónico en Firebase');
        
        // Actualizar la sesión en Firebase con el nuevo asistente
        console.log('[markAttendance] Guardando asistente en:', `${SESSIONS_PATH}/${sessionId}/attendees/${studentId}`);
        await firebaseUtils.write(`${SESSIONS_PATH}/${sessionId}/attendees/${studentId}`, attendance);
        
        // Actualizar el array completo de asistentes
        console.log('[markAttendance] Actualizando array de asistentes');
        await firebaseUtils.update(`${SESSIONS_PATH}/${sessionId}`, {
          attendees: updatedAttendees
        });

        console.log('[markAttendance] Asistencia guardada en sesión');

        // También guardar en la tabla de asistencia global para que el dashboard pueda acceder
        const globalAttendanceRecord = {
          sessionId,
          studentId,
          studentName,
          studentEmail: studentEmail || null,
          studentPhone: studentPhone || null,
          courseId: session.courseId,
          courseName: session.courseName,
          teacherId: session.teacherId,
          markedAt: new Date().toISOString(),
        };

        // Guardar en path general de asistencia
        console.log('[markAttendance] Guardando en path global de asistencia');
        await firebaseUtils.write(
          `attendance/${new Date().getTime()}_${sessionId}_${studentId}`,
          globalAttendanceRecord
        );

        // También guardar en el path específico del docente si es necesario
        if (session.teacherId) {
          console.log('[markAttendance] Guardando en path del docente');
          await firebaseUtils.write(
            `teachers/${session.teacherId}/attendance/${new Date().getTime()}_${studentId}`,
            globalAttendanceRecord
          );
        }

        // Guardar/actualizar estudiante en la base de datos
        try {
          console.log('[markAttendance] Buscando estudiante existente');
          const existingStudent = await getStudentByStudentId(studentId);
          if (existingStudent) {
            // Actualizar estudiante existente usando su id interno
            console.log('[markAttendance] Actualizando estudiante existente');
            await updateStudent(existingStudent.id, {
              name: studentName,
              email: studentEmail || existingStudent.email,
              phone: studentPhone || existingStudent.phone,
            });
            console.log(`[markAttendance] Estudiante actualizado: ${studentId}`);
          } else {
            // Crear nuevo estudiante
            console.log('[markAttendance] Creando nuevo estudiante');
            await createStudent({
              name: studentName,
              email: studentEmail || '',
              studentId: studentId,
              phone: studentPhone || '',
            });
            console.log(`[markAttendance] Nuevo estudiante creado: ${studentId}`);
          }
        } catch (error) {
          console.error("[markAttendance] Error guardando estudiante:", error);
          // No fallar la asistencia si hay error guardando el estudiante
        }

        console.log(`[markAttendance] Asistencia completamente guardada: ${studentName || studentId} en sesion ${sessionId}`);
      } catch (error) {
        console.error("[markAttendance] Error guardando asistencia en Firebase:", error.message);
      }
    })();
  } catch (error) {
    console.error("[markAttendance] Error en markAttendance:", error.message);
    res.status(500).json({
      message: "Error marking attendance",
    });
  }
};

/**
 * Obtener reporte de asistencia de una sesión
 * GET /api/sessions/:sessionId/attendance
 */
exports.getSessionAttendance = async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await firebaseUtils.readOnce(`${SESSIONS_PATH}/${sessionId}`);
    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    // Obtener asistentes desde Firebase (pueden estar en attendees array o en attendees object)
    let attendees = [];
    if (session.attendees) {
      if (Array.isArray(session.attendees)) {
        attendees = session.attendees;
      } else {
        // Si es un objeto, convertirlo a array
        attendees = Object.values(session.attendees);
      }
    }

    res.json({
      sessionId,
      courseId: session.courseId,
      courseName: session.courseName,
      totalAttendees: attendees.length,
      attendees: attendees,
      createdAt: session.createdAt,
      closedAt: session.closedAt || null,
    });
  } catch (error) {
    console.error("Error getting session attendance:", error);
    res.status(500).json({
      message: "Error getting session attendance",
    });
  }
};
