const crypto = require("crypto");
const { firebaseUtils } = require("../config/firebase");

// Usar Firebase para almacenar inscripciones estudiante-curso
const DB_PATH = "enrollments";

function generateId() {
  return crypto.randomUUID();
}

async function enrollStudent({ studentId, courseId, carrera, ciclo }) {
  if (!studentId) throw new Error("Student ID is required");
  if (!courseId) throw new Error("Course ID is required");
  
  const id = generateId();
  const enrollment = { 
    id, 
    studentId, 
    courseId,
    carrera: carrera || '',
    ciclo: ciclo || '',
    status: 'active', // active, inactive, completed
    enrolledAt: new Date().toISOString()
  };
  
  try {
    await firebaseUtils.write(`${DB_PATH}/${id}`, enrollment);
    console.log(`✅ Student enrolled: ${studentId} -> ${courseId}`);
    return enrollment;
  } catch (error) {
    console.error("Error enrolling student:", error);
    throw error;
  }
}

async function getEnrollmentById(id) {
  try {
    const enrollment = await firebaseUtils.readOnce(`${DB_PATH}/${id}`);
    return enrollment || null;
  } catch (error) {
    console.error("Error getting enrollment:", error);
    throw error;
  }
}

async function getEnrollmentByStudentAndCourse(studentId, courseId) {
  try {
    const allEnrollments = await firebaseUtils.readOnce(DB_PATH);
    if (!allEnrollments) return null;
    
    for (const id in allEnrollments) {
      const enrollment = allEnrollments[id];
      if (enrollment.studentId === studentId && enrollment.courseId === courseId) {
        return enrollment;
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting enrollment:", error);
    throw error;
  }
}

async function listEnrollmentsByStudent(studentId) {
  try {
    const allEnrollments = await firebaseUtils.readOnce(DB_PATH);
    if (!allEnrollments) return [];
    
    return Object.values(allEnrollments).filter(e => e.studentId === studentId && e.status === 'active');
  } catch (error) {
    console.error("Error listing enrollments by student:", error);
    throw error;
  }
}

async function listEnrollmentsByCourse(courseId) {
  try {
    const allEnrollments = await firebaseUtils.readOnce(DB_PATH);
    if (!allEnrollments) return [];
    
    return Object.values(allEnrollments).filter(e => e.courseId === courseId && e.status === 'active');
  } catch (error) {
    console.error("Error listing enrollments by course:", error);
    throw error;
  }
}

async function listAllEnrollments() {
  try {
    const enrollments = await firebaseUtils.readOnce(DB_PATH);
    if (!enrollments) return [];
    return Object.values(enrollments);
  } catch (error) {
    console.error("Error listing all enrollments:", error);
    throw error;
  }
}

async function updateEnrollment(id, updates) {
  try {
    const existing = await getEnrollmentById(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await firebaseUtils.update(`${DB_PATH}/${id}`, updated);
    console.log(`✅ Enrollment updated: ${id}`);
    return updated;
  } catch (error) {
    console.error("Error updating enrollment:", error);
    throw error;
  }
}

async function deleteEnrollment(id) {
  try {
    const exists = await getEnrollmentById(id);
    if (!exists) return false;
    await firebaseUtils.delete(`${DB_PATH}/${id}`);
    console.log(`✅ Enrollment deleted: ${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    throw error;
  }
}

async function unenrollStudent(studentId, courseId) {
  try {
    const enrollment = await getEnrollmentByStudentAndCourse(studentId, courseId);
    if (!enrollment) return false;
    
    // Cambiar estado a inactivo en lugar de eliminar
    await updateEnrollment(enrollment.id, { status: 'inactive' });
    console.log(`✅ Student unenrolled: ${studentId} from ${courseId}`);
    return true;
  } catch (error) {
    console.error("Error unenrolling student:", error);
    throw error;
  }
}

// Función para escuchar cambios en tiempo real
function watchEnrollments(callback) {
  return firebaseUtils.onValueChange(DB_PATH, callback);
}

module.exports = {
  enrollStudent,
  getEnrollmentById,
  getEnrollmentByStudentAndCourse,
  listEnrollmentsByStudent,
  listEnrollmentsByCourse,
  listAllEnrollments,
  updateEnrollment,
  deleteEnrollment,
  unenrollStudent,
  watchEnrollments
};
