const express = require("express");
const router = express.Router();

const studentController = require("../controllers/studentController");
const courseController = require("../controllers/courseController");
const attendanceController = require("../controllers/attendanceController");
const sessionController = require("../controllers/sessionController");

// ============ HEALTH CHECK ============
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ============ STUDENTS ============
router.get("/students", studentController.list);
router.get("/students/:id", studentController.get);
router.post("/students", studentController.create);
router.put("/students/:id", studentController.update);
router.delete("/students/:id", studentController.remove);

// ============ COURSES ============
router.get("/courses", courseController.list);
router.get("/courses/:id", courseController.get);
router.post("/courses", courseController.create);
router.put("/courses/:id", courseController.update);
router.delete("/courses/:id", courseController.remove);

// ============ ATTENDANCE (Legacy) ============
router.get("/attendance/:id", attendanceController.get);
router.get("/attendance", attendanceController.listAll);
router.get("/students/:studentId/attendance", attendanceController.listByStudent);
router.get("/courses/:courseId/attendance", attendanceController.listByCourse);
router.post("/attendance", attendanceController.create);
router.delete("/attendance/:id", attendanceController.remove);

// ============ SESSIONS (QR-based attendance) ============
// Crear nueva sesión QR (docente genera QR)
router.post("/sessions", sessionController.createSession);

// Obtener información de una sesión
router.get("/sessions/:sessionId", sessionController.getSession);

// Listar todas las sesiones activas
router.get("/sessions", sessionController.listSessions);

// Cerrar una sesión (dejar de aceptar asistencias)
router.patch("/sessions/:sessionId/close", sessionController.closeSession);

// Marcar asistencia en una sesión (desde escaneo QR)
router.post("/sessions/:sessionId/attendance", sessionController.markAttendance);

// Obtener reporte de asistencia de una sesión
router.get("/sessions/:sessionId/attendance", sessionController.getSessionAttendance);

// Obtener configuración de Firebase para el frontend (sin credenciales sensibles del admin)
router.get("/config/firebase", (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    databaseURL: process.env.FIREBASE_DATABASE_URL || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || ""
  });
});

module.exports = router;


