const {
  createStudent,
  getStudentById,
  listStudents,
  updateStudent,
  deleteStudent,
} = require("../models");

exports.list = async (req, res) => {
  try {
    const students = await listStudents();
    res.json(students);
  } catch (error) {
    console.error("Error listing students:", error);
    res.status(500).json({ message: "Error listing students" });
  }
};

exports.get = async (req, res) => {
  try {
    const student = await getStudentById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (error) {
    console.error("Error getting student:", error);
    res.status(500).json({ message: "Error getting student" });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, studentId, phone, carrera, ciclo, curso } = req.body || {};
    if (!name) return res.status(400).json({ message: "name is required" });
    const student = await createStudent({ name, email, studentId, phone, carrera, ciclo, curso });
    res.status(201).json(student);
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ message: "Error creating student" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateStudent(id, req.body || {});
    if (!updated) return res.status(404).json({ message: "Student not found" });
    res.json(updated);
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ message: "Error updating student" });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await deleteStudent(req.params.id);
    if (!ok) return res.status(404).json({ message: "Student not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Error deleting student" });
  }
};


