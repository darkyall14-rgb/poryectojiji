const {
  createStudent,
  getStudentById,
  listStudents,
  updateStudent,
  deleteStudent,
} = require("../models");

exports.list = (req, res) => {
  res.json(listStudents());
};

exports.get = (req, res) => {
  const student = getStudentById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
};

exports.create = (req, res) => {
  const { name, email, studentId, phone } = req.body || {};
  if (!name) return res.status(400).json({ message: "name is required" });
  const student = createStudent({ name, email, studentId, phone });
  res.status(201).json(student);
};

exports.update = (req, res) => {
  const { id } = req.params;
  const updated = updateStudent(id, req.body || {});
  if (!updated) return res.status(404).json({ message: "Student not found" });
  res.json(updated);
};

exports.remove = (req, res) => {
  const ok = deleteStudent(req.params.id);
  if (!ok) return res.status(404).json({ message: "Student not found" });
  res.status(204).send();
};


