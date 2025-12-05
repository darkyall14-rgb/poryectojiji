const crypto = require("crypto");

// Simple in-memory student store. Replace with DB later if needed.
const studentStore = new Map(); // id -> student

function generateId() {
  return crypto.randomUUID();
}

function createStudent({ name, email, studentId, phone }) {
  const id = generateId();
  const student = { id, name, email, studentId, phone };
  studentStore.set(id, student);
  return student;
}

function getStudentById(id) {
  return studentStore.get(id) || null;
}

function listStudents() {
  return Array.from(studentStore.values());
}

function updateStudent(id, updates) {
  const existing = studentStore.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, id };
  studentStore.set(id, updated);
  return updated;
}

function deleteStudent(id) {
  return studentStore.delete(id);
}

module.exports = {
  createStudent,
  getStudentById,
  listStudents,
  updateStudent,
  deleteStudent,
};


