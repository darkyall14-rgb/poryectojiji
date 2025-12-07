const { firebaseUtils } = require("../config/firebase");
const { getEnrollmentByStudentAndCourse } = require("../models");

// Function to create a new enrollment
async function createEnrollment(req, res) {
  try {
    const { studentId, courseId } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ message: "Student ID and Course ID are required." });
    }

    const enrollment = await getEnrollmentByStudentAndCourse(studentId, courseId);
    if (enrollment) {
      return res.status(400).json({ message: "Student is already enrolled in this course." });
    }

    const newEnrollment = {
      studentId,
      courseId,
      enrolledAt: new Date().toISOString(),
    };

    await firebaseUtils.write(`enrollments/${studentId}_${courseId}`, newEnrollment);
    res.status(201).json({ message: "Enrollment created successfully.", enrollment: newEnrollment });
  } catch (error) {
    console.error("Error creating enrollment:", error);
    res.status(500).json({ message: "Error creating enrollment." });
  }
}

module.exports = {
  createEnrollment,
};