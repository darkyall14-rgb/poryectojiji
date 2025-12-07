const {
  createCourse,
  getCourseById,
  listCourses,
  updateCourse,
  deleteCourse,
} = require("../models");

exports.list = async (req, res) => {
  try {
    const courses = await listCourses();
    res.json(courses);
  } catch (error) {
    console.error("Error listing courses:", error);
    res.status(500).json({ message: "Error listing courses" });
  }
};

exports.get = async (req, res) => {
  try {
    const course = await getCourseById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (error) {
    console.error("Error getting course:", error);
    res.status(500).json({ message: "Error getting course" });
  }
};

exports.create = async (req, res) => {
  try {
    const course = await createCourse(req.body);
    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateCourse(id, req.body || {});
    if (!updated) return res.status(404).json({ message: "Course not found" });
    res.json(updated);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Error updating course" });
  }
};

exports.remove = async (req, res) => {
  try {
    const ok = await deleteCourse(req.params.id);
    if (!ok) return res.status(404).json({ message: "Course not found" });
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course" });
  }
};
