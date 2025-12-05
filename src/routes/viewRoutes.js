const express = require("express");
const router = express.Router();

const viewController = require("../controllers/viewController");

router.get("/", viewController.getHome);
router.get("/student", viewController.getStudent);
router.get("/student-dashboard", viewController.getStudentDashboard);

module.exports = router;


