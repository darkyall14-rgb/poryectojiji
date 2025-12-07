const crypto = require("crypto");
const { firebaseUtils } = require("../config/firebase");

// Usar Firebase para almacenar cursos
const DB_PATH = "courses";

function generateId() {
  return crypto.randomUUID();
}

async function createCourse({ name, code, teacher, description, schedule, instructor, room, isDefault }) {
  if (!name) throw new Error("Course name is required");
  
  const id = generateId();
  const course = { 
    id, 
    name, 
    code: code || '', 
    teacher: teacher || '', 
    description: description || '', 
    schedule: schedule || '', 
    instructor: instructor || '', 
    room: room || '', 
    isDefault: isDefault || false,
    createdAt: new Date().toISOString()
  };
  
  try {
    await firebaseUtils.write(`${DB_PATH}/${id}`, course);
    console.log(`✅ Course created: ${id}`);
    return course;
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
}

async function getCourseById(id) {
  try {
    const course = await firebaseUtils.readOnce(`${DB_PATH}/${id}`);
    return course || null;
  } catch (error) {
    console.error("Error getting course:", error);
    throw error;
  }
}

async function listCourses() {
  try {
    const courses = await firebaseUtils.readOnce(DB_PATH);
    if (!courses) return [];
    return Object.values(courses);
  } catch (error) {
    console.error("Error listing courses:", error);
    throw error;
  }
}

async function updateCourse(id, updates) {
  try {
    const existing = await getCourseById(id);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };
    await firebaseUtils.update(`${DB_PATH}/${id}`, updated);
    console.log(`✅ Course updated: ${id}`);
    return updated;
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
}

async function deleteCourse(id) {
  try {
    const exists = await getCourseById(id);
    if (!exists) return false;
    await firebaseUtils.delete(`${DB_PATH}/${id}`);
    console.log(`✅ Course deleted: ${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
}

// Función para escuchar cambios en tiempo real
function watchCourses(callback) {
  return firebaseUtils.onValueChange(DB_PATH, callback);
}

module.exports = {
  createCourse,
  getCourseById,
  listCourses,
  updateCourse,
  deleteCourse,
  watchCourses
};


