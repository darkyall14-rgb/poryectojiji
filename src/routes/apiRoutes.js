const express = require("express");
const router = express.Router();

const studentController = require("../controllers/studentController");
const courseController = require("../controllers/courseController");
const attendanceController = require("../controllers/attendanceController");

// Students
router.get("/students", studentController.list);
router.get("/students/:id", studentController.get);
router.post("/students", studentController.create);
router.put("/students/:id", studentController.update);
router.delete("/students/:id", studentController.remove);

// Courses
router.get("/courses", courseController.list);
router.get("/courses/:id", courseController.get);
router.post("/courses", courseController.create);
router.put("/courses/:id", courseController.update);
router.delete("/courses/:id", courseController.remove);

// Attendance
router.get("/attendance/:id", attendanceController.get);
router.get("/attendance", attendanceController.listAll);
router.get("/students/:studentId/attendance", attendanceController.listByStudent);
router.get("/courses/:courseId/attendance", attendanceController.listByCourse);
router.post("/attendance", attendanceController.create);
router.delete("/attendance/:id", attendanceController.remove);

module.exports = router;


