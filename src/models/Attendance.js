const crypto = require("crypto");
const { firebaseUtils } = require("../config/firebase");

// Usar Firebase para almacenar asistencia
const DB_PATH = "attendance";

function generateId() {
  return crypto.randomUUID();
}

async function createAttendance({ studentId, courseId, timestamp = Date.now(), studentName, studentDni }) {
  if (!courseId) throw new Error("Course ID is required");
  
  const id = generateId();
  const attendance = { 
    id, 
    studentId: studentId || '', 
    courseId, 
    timestamp: timestamp || new Date().toISOString(), 
    studentName: studentName || '', 
    studentDni: studentDni || '',
    recordedAt: new Date().toISOString()
  };
  
  try {
    await firebaseUtils.write(`${DB_PATH}/${id}`, attendance);
    console.log(`✅ Attendance created: ${id}`);
    return attendance;
  } catch (error) {
    console.error("Error creating attendance:", error);
    throw error;
  }
}

async function getAttendanceById(id) {
  try {
    const attendance = await firebaseUtils.readOnce(`${DB_PATH}/${id}`);
    return attendance || null;
  } catch (error) {
    console.error("Error getting attendance:", error);
    throw error;
  }
}

async function listAttendanceByStudent(studentId) {
  try {
    const allAttendance = await firebaseUtils.readOnce(DB_PATH);
    if (!allAttendance) return [];
    
    return Object.values(allAttendance).filter(a => a.studentId === studentId);
  } catch (error) {
    console.error("Error listing attendance by student:", error);
    throw error;
  }
}

async function listAttendanceByCourse(courseId) {
  try {
    const allAttendance = await firebaseUtils.readOnce(DB_PATH);
    if (!allAttendance) return [];
    
    return Object.values(allAttendance).filter(a => a.courseId === courseId);
  } catch (error) {
    console.error("Error listing attendance by course:", error);
    throw error;
  }
}

async function listAllAttendance() {
  try {
    const attendance = await firebaseUtils.readOnce(DB_PATH);
    if (!attendance) return [];
    return Object.values(attendance);
  } catch (error) {
    console.error("Error listing all attendance:", error);
    throw error;
  }
}

async function deleteAttendance(id) {
  try {
    const exists = await getAttendanceById(id);
    if (!exists) return false;
    await firebaseUtils.delete(`${DB_PATH}/${id}`);
    console.log(`✅ Attendance deleted: ${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting attendance:", error);
    throw error;
  }
}

// Función para escuchar cambios en tiempo real
function watchAttendance(callback) {
  return firebaseUtils.onValueChange(DB_PATH, callback);
}

module.exports = {
  createAttendance,
  getAttendanceById,
  listAttendanceByStudent,
  listAttendanceByCourse,
  listAllAttendance,
  deleteAttendance,
  watchAttendance
};


