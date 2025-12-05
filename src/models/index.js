const Student = require("./Student");
const Course = require("./Course");
const Attendance = require("./Attendance");

module.exports = {
  ...Student,
  ...Course,
  ...Attendance,
};


