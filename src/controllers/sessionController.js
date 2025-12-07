const { v4: uuidv4 } = require('uuid');
const { createStudent, getStudentByStudentId, updateStudent, listStudents } = require("../models");
const { firebaseUtils } = require("../config/firebase");

// Path en Firebase para sesiones
const SESSIONS_PATH = "sessions";

/**
 * Crear una nueva sesión QR para que los estudiantes escaneen
 * POST /api/sessions
 */
exports.createSession = async (req, res) => {
  const { courseId, courseName, teacherId, teacherName } = req.body;

  if (!courseId || !teacherId) {
    return res.status(400).json({
      message: "courseId and teacherId are required",
    });
  }

  const sessionId = uuidv4();
  const qrUrl = `${req.protocol}://${req.get('host')}/scan?sessionId=${sessionId}`;

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
    // Guardar en Firebase
    await firebaseUtils.write(`${SESSIONS_PATH}/${sessionId}`, session);
    console.log(`✓ Session created: ${sessionId} for course ${courseId}`);
  } catch (error) {
    console.error("Error saving session to Firebase:", error);
    return res.status(500).json({
      message: "Error creating session",
    });
  }

  res.status(201).json({
    sessionId,
    qrUrl,
    message: "Session created successfully. Share this QR code with students.",
  });
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

  if (!sessionId) {
    return res.status(400).json({
      message: "sessionId is required",
    });
  }

  if (!studentId && !studentName) {
    return res.status(400).json({
      message: "studentId or studentName is required",
    });
  }

  try {
    const session = await firebaseUtils.readOnce(`${SESSIONS_PATH}/${sessionId}`);
    if (!session) {
      return res.status(404).json({
        message: "Session not found",
      });
    }

    if (session.status !== 'active') {
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

    // Guardar en Firebase
    try {
      // Actualizar la sesión en Firebase con el nuevo asistente
      await firebaseUtils.write(`${SESSIONS_PATH}/${sessionId}/attendees/${studentId}`, attendance);
      // Actualizar el array completo de asistentes
      await firebaseUtils.update(`${SESSIONS_PATH}/${sessionId}`, {
        attendees: updatedAttendees
      });

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
      await firebaseUtils.write(
        `attendance/${new Date().getTime()}_${sessionId}_${studentId}`,
        globalAttendanceRecord
      );

      // También guardar en el path específico del docente si es necesario
      if (session.teacherId) {
        await firebaseUtils.write(
          `teachers/${session.teacherId}/attendance/${new Date().getTime()}_${studentId}`,
          globalAttendanceRecord
        );
      }

    } catch (error) {
      console.error("Error saving attendance to Firebase:", error);
      return res.status(500).json({
        message: "Error saving attendance",
      });
    }

    // Guardar/actualizar estudiante en la base de datos
    try {
      const existingStudent = await getStudentByStudentId(studentId);
      if (existingStudent) {
        // Actualizar estudiante existente usando su id interno
        await updateStudent(existingStudent.id, {
          name: studentName,
          email: studentEmail || existingStudent.email,
          phone: studentPhone || existingStudent.phone,
        });
        console.log(`✓ Student updated: ${studentId}`);
      } else {
        // Crear nuevo estudiante
        await createStudent({
          name: studentName,
          email: studentEmail || '',
          studentId: studentId,
          phone: studentPhone || '',
        });
        console.log(`✓ New student created: ${studentId}`);
      }
    } catch (error) {
      console.error("Error saving student:", error);
      // No fallar la asistencia si hay error guardando el estudiante
    }

    console.log(
      `✓ Attendance marked: ${studentName || studentId} in session ${sessionId}`
    );

    res.status(201).json({
      message: "Attendance marked successfully",
      attendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
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
