const {
  createAttendance,
  getAttendanceById,
  listAttendanceByStudent,
  listAttendanceByCourse,
  listAllAttendance,
  deleteAttendance,
  getStudentById,
  getCourseById,
} = require("../models");

exports.listByStudent = (req, res) => {
  const { studentId } = req.params;
  if (!getStudentById(studentId)) return res.status(404).json({ message: "Student not found" });
  res.json(listAttendanceByStudent(studentId));
};

exports.listByCourse = (req, res) => {
  const { courseId } = req.params;
  if (!getCourseById(courseId)) return res.status(404).json({ message: "Course not found" });
  res.json(listAttendanceByCourse(courseId));
};

exports.get = (req, res) => {
  const att = getAttendanceById(req.params.id);
  if (!att) return res.status(404).json({ message: "Attendance not found" });
  res.json(att);
};

exports.create = (req, res) => {
  const { studentId, courseId, timestamp, studentName, studentDni } = req.body || {};
  if (!courseId) return res.status(400).json({ message: "courseId is required" });
  // Accept flexible payload from QR: either a known studentId, or name/dni
  const att = createAttendance({ studentId, courseId, timestamp, studentName, studentDni });
  res.status(201).json(att);
};

exports.listAll = (req, res) => {
  res.json(listAllAttendance());
};

exports.remove = (req, res) => {
  const ok = deleteAttendance(req.params.id);
  if (!ok) return res.status(404).json({ message: "Attendance not found" });
  res.status(204).send();
};


