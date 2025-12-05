const crypto = require("crypto");

// Simple in-memory course store. Replace with DB later if needed.
const courseStore = new Map(); // id -> course

function generateId() {
  return crypto.randomUUID();
}

function createCourse({ name, code, teacher, description, schedule, instructor, room, isDefault }) {
  const id = generateId();
  const course = { id, name, code, teacher, description, schedule, instructor, room, isDefault };
  courseStore.set(id, course);
  return course;
}

function getCourseById(id) {
  return courseStore.get(id) || null;
}

function listCourses() {
  return Array.from(courseStore.values());
}

function updateCourse(id, updates) {
  const existing = courseStore.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, id };
  courseStore.set(id, updated);
  return updated;
}

function deleteCourse(id) {
  return courseStore.delete(id);
}

module.exports = {
  createCourse,
  getCourseById,
  listCourses,
  updateCourse,
  deleteCourse,
};


