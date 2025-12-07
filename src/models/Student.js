const crypto = require("crypto");
const { firebaseUtils } = require("../config/firebase");

// Usar Firebase para almacenar estudiantes
const DB_PATH = "students";

function generateId() {
  return crypto.randomUUID();
}

async function createStudent({ name, email, studentId, phone }) {
  if (!name) throw new Error("Student name is required");
  
  const id = generateId();
  const student = { 
    id, 
    name, 
    email: email || '', 
    studentId: studentId || '', 
    phone: phone || '',
    createdAt: new Date().toISOString()
  };
  
  try {
    await firebaseUtils.write(`${DB_PATH}/${id}`, student);
    console.log(`✅ Student created: ${id}`);
    return student;
  } catch (error) {
    console.error("Error creating student:", error);
    throw error;
  }
}

async function getStudentById(id) {
  try {
    const student = await firebaseUtils.readOnce(`${DB_PATH}/${id}`);
    return student || null;
  } catch (error) {
    console.error("Error getting student:", error);
    throw error;
  }
}

async function getStudentByStudentId(studentId) {
  try {
    const students = await firebaseUtils.readOnce(DB_PATH);
    if (!students) return null;
    
    // Buscar estudiante por studentId (número de identificación)
    for (const id in students) {
      if (students[id].studentId === studentId) {
        return students[id];
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting student by studentId:", error);
    throw error;
  }
}

async function listStudents() {
  try {
    const students = await firebaseUtils.readOnce(DB_PATH);
    if (!students) return [];
    return Object.values(students);
  } catch (error) {
    console.error("Error listing students:", error);
    throw error;
  }
}

async function updateStudent(id, updates) {
  try {
    const existing = await getStudentById(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await firebaseUtils.update(`${DB_PATH}/${id}`, updated);
    console.log(`✅ Student updated: ${id}`);
    return updated;
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
}

async function deleteStudent(id) {
  try {
    const exists = await getStudentById(id);
    if (!exists) return false;
    await firebaseUtils.delete(`${DB_PATH}/${id}`);
    console.log(`✅ Student deleted: ${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
}

// Función para escuchar cambios en tiempo real (para uso en controladores)
function watchStudents(callback) {
  return firebaseUtils.onValueChange(DB_PATH, callback);
}

module.exports = {
  createStudent,
  getStudentById,
  getStudentByStudentId,
  listStudents,
  updateStudent,
  deleteStudent,
  watchStudents
};


