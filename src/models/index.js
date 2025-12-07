const Student = require("./Student");
const Course = require("./Course");
const Attendance = require("./Attendance");
const StudentEnrollment = require("./StudentEnrollment");

module.exports = {
  ...Student,
  ...Course,
  ...Attendance,
  ...StudentEnrollment,
};


