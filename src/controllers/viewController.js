const path = require('path');

// Resolve views relative to this controller file to avoid issues with cwd
const viewsDir = path.join(__dirname, '..', 'views');

function sendView(res, filename) {
  const filePath = path.join(viewsDir, filename);
  // Basic check so server logs a clear error instead of an opaque ENOENT
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending view', filePath, err && err.message);
      if (!res.headersSent) res.status(err.status || 500).send('Error loading page');
    }
  });
}

exports.getHome = (req, res) => sendView(res, 'index.html');
exports.getStudent = (req, res) => sendView(res, 'student.html');
exports.getStudentDashboard = (req, res) => sendView(res, 'student-dashboard.html');


