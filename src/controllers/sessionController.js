const { v4: uuidv4 } = require('uuid');
const { createStudent, getStudentByStudentId, updateStudent, listStudents, getEnrollmentByStudentAndCourse } = require("../models");
const { firebaseUtils } = require("../config/firebase");

// Function to handle student enrollment
async function enrollStudentInCourse(studentId, courseId) {
  try {
    const enrollment = await getEnrollmentByStudentAndCourse(studentId, courseId);
    if (enrollment) {
      return { message: 'Student is already enrolled in this course.' };
    }

    const newEnrollment = {
      studentId,
      courseId,
      enrolledAt: new Date().toISOString(),
    };

    await firebaseUtils.write(`enrollments/${studentId}_${courseId}`, newEnrollment);
    return { message: 'Student successfully enrolled in the course.', enrollment: newEnrollment };
  } catch (error) {
    console.error('Error enrolling student in course:', error);
    throw error;
  }
}

// Function to validate QR session
async function validateQRSession(studentId, courseId) {
  try {
    const enrollment = await getEnrollmentByStudentAndCourse(studentId, courseId);
    if (!enrollment) {
      return { valid: false, message: 'Student is not enrolled in this course.' };
    }

    return { valid: true, message: 'Student is enrolled in the course.' };
  } catch (error) {
    console.error('Error validating QR session:', error);
    throw error;
  }
}

// Function to mark attendance with enrollment validation
async function markAttendance(studentId, courseId) {
  try {
    const enrollment = await getEnrollmentByStudentAndCourse(studentId, courseId);
    if (!enrollment) {
      return { success: false, message: 'Student is not enrolled in this course.' };
    }

    // Logic to mark attendance
    const attendanceRecord = {
      studentId,
      courseId,
      timestamp: new Date().toISOString(),
    };

    await firebaseUtils.write(`attendance/${studentId}_${courseId}`, attendanceRecord);
    return { success: true, message: 'Attendance marked successfully.', record: attendanceRecord };
  } catch (error) {
    console.error('Error marking attendance:', error);
    throw error;
  }
}

module.exports = {
  createStudent,
  getStudentByStudentId,
  updateStudent,
  listStudents,
  getEnrollmentByStudentAndCourse,
  enrollStudentInCourse,
  validateQRSession,
  markAttendance,
};
