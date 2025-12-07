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

// Function to create a session
async function createSession(req, res) {
  try {
    const sessionId = uuidv4();
    const sessionData = {
      id: sessionId,
      createdAt: new Date().toISOString(),
    };

    await firebaseUtils.write(`sessions/${sessionId}`, sessionData);
    res.status(201).json({ message: "Session created successfully", session: sessionData });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(500).json({ message: "Error creating session" });
  }
}

// Function to get session information
async function getSession(req, res) {
  try {
    const { sessionId } = req.params;
    const sessionData = await firebaseUtils.readOnce(`sessions/${sessionId}`);

    if (!sessionData) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json(sessionData);
  } catch (error) {
    console.error("Error getting session:", error);
    res.status(500).json({ message: "Error getting session" });
  }
}

// Function to list all active sessions
async function listSessions(req, res) {
  try {
    const sessions = await firebaseUtils.readOnce("sessions");

    if (!sessions) {
      return res.status(404).json({ message: "No active sessions found" });
    }

    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error listing sessions:", error);
    res.status(500).json({ message: "Error listing sessions" });
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
  createSession,
  getSession,
  listSessions,
};
