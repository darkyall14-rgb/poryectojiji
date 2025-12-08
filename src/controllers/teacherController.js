const { firebaseUtils } = require('../config/firebase');

// List courses for a specific teacher (teacher-scoped courses)
exports.listCourses = async (req, res) => {
  try {
    const { uid } = req.params;
    const data = await firebaseUtils.readOnce(`teachers/${uid}/courses`);
    if (!data) return res.status(200).json([]);
    // convert object to array
    const arr = Object.entries(data).map(([key, val]) => ({ key, ...val }));
    res.status(200).json(arr);
  } catch (error) {
    console.error('Error listing teacher courses:', error);
    res.status(500).json({ message: 'Error listing teacher courses' });
  }
};

// List students for a specific teacher
exports.listStudents = async (req, res) => {
  try {
    const { uid } = req.params;
    const data = await firebaseUtils.readOnce(`teachers/${uid}/students`);
    if (!data) return res.status(200).json([]);
    const arr = Object.entries(data).map(([key, val]) => ({ key, ...val }));
    res.status(200).json(arr);
  } catch (error) {
    console.error('Error listing teacher students:', error);
    res.status(500).json({ message: 'Error listing teacher students' });
  }
};
