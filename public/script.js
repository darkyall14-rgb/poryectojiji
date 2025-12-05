// Client logic to read Realtime Database (ES module)
import { db } from './firebase-config.js';
import { ref, onValue, get, child } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

// Example: adjust these paths to match your actual DB structure
// Common nodes: 'students', 'courses', 'attendance'

// Utility: read and return a snapshot once
async function readOnce(path) {
  const dbRef = ref(db, path);
  const snap = await get(dbRef);
  return snap.exists() ? snap.val() : null;
}

// Live listener for a node
function listen(path, callback) {
  const dbRef = ref(db, path);
  onValue(dbRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
}

// Example: load all students once
export async function loadStudentsOnce() {
  const data = await readOnce('students');
  console.log('Students (once):', data);
  renderStudents(data);
}

// Example: live update students
export function watchStudents() {
  listen('students', (data) => {
    console.log('Students (live):', data);
    renderStudents(data);
  });
}

// Example: load courses and attendance
export async function loadCoursesOnce() {
  const data = await readOnce('courses');
  console.log('Courses:', data);
  renderCourses(data);
}

export async function loadAttendanceOnce() {
  const data = await readOnce('attendance');
  console.log('Attendance:', data);
  renderAttendance(data);
}

// DOM render helpers — adjust to your HTML structure
function renderStudents(studentsObj) {
  const container = document.getElementById('students-list');
  if (!container) return;
  container.innerHTML = '';
  if (!studentsObj) return (container.innerHTML = '<p>No students found</p>');
  // assuming students stored as { studentId: { name: '...', email: '...' } }
  Object.entries(studentsObj).forEach(([id, student]) => {
    const el = document.createElement('div');
    el.className = 'student-item';
    el.textContent = `${student.name ?? id} — ${student.email ?? ''}`;
    container.appendChild(el);
  });
}

function renderCourses(coursesObj) {
  const container = document.getElementById('courses-list');
  if (!container) return;
  container.innerHTML = '';
  if (!coursesObj) return (container.innerHTML = '<p>No courses found</p>');
  Object.entries(coursesObj).forEach(([id, course]) => {
    const el = document.createElement('div');
    el.className = 'course-item';
    el.textContent = `${course.name ?? id}`;
    container.appendChild(el);
  });
}

function renderAttendance(attObj) {
  const container = document.getElementById('attendance-list');
  if (!container) return;
  container.innerHTML = '';
  if (!attObj) return (container.innerHTML = '<p>No attendance records</p>');
  // adjust this rendering to match your attendance schema
  Object.entries(attObj).forEach(([id, rec]) => {
    const el = document.createElement('div');
    el.className = 'attendance-item';
    el.textContent = `${id}: ${JSON.stringify(rec)}`;
    container.appendChild(el);
  });
}

// Auto-start example: once the DOM is ready, load initial data
window.addEventListener('DOMContentLoaded', () => {
  // call whichever you prefer
  loadStudentsOnce();
  loadCoursesOnce();
  loadAttendanceOnce();
  // or use live listeners
  // watchStudents();
});
