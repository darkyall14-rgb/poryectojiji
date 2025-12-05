const crypto = require("crypto");

// Simple in-memory attendance store. Replace with DB later if needed.
const attendanceStore = new Map(); // id -> attendance

function generateId() {
  return crypto.randomUUID();
}

function createAttendance({ studentId, courseId, timestamp = Date.now(), studentName, studentDni }) {
  const id = generateId();
  const attendance = { id, studentId, courseId, timestamp, studentName, studentDni };
  attendanceStore.set(id, attendance);
  return attendance;
}

function getAttendanceById(id) {
  return attendanceStore.get(id) || null;
}

function listAttendanceByStudent(studentId) {
  return Array.from(attendanceStore.values()).filter(a => a.studentId === studentId);
}

function listAttendanceByCourse(courseId) {
  return Array.from(attendanceStore.values()).filter(a => a.courseId === courseId);
}

function listAllAttendance() {
  return Array.from(attendanceStore.values());
}

function deleteAttendance(id) {
  return attendanceStore.delete(id);
}

module.exports = {
  createAttendance,
  getAttendanceById,
  listAttendanceByStudent,
  listAttendanceByCourse,
  listAllAttendance,
  deleteAttendance,
};


