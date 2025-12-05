const Course = require('../models/Course');

exports.list = (req, res) => {
    try {
        const courses = Course.listCourses();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.get = (req, res) => {
    try {
        const course = Course.getCourseById(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = (req, res) => {
    try {
        const course = Course.createCourse(req.body);
        res.status(201).json(course);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.update = (req, res) => {
    try {
        const course = Course.updateCourse(req.params.id, req.body);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.remove = (req, res) => {
    try {
        const deleted = Course.deleteCourse(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};