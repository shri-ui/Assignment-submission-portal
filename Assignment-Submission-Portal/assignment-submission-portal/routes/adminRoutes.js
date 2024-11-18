const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');

const router = express.Router();

// Register a new admin
router.post('/register', async (req, res) => {
  try {
    const admin = new User({ ...req.body, isAdmin: true });
    await admin.save();
    const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET);
    res.status(201).send({ admin, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Admin login
router.post('/login', async (req, res) => {
  try {
    const admin = await User.findOne({ username: req.body.username, isAdmin: true });
    if (!admin || !(await admin.comparePassword(req.body.password))) {
      return res.status(401).send({ error: 'Invalid login credentials' });
    }
    const token = jwt.sign({ _id: admin._id }, process.env.JWT_SECRET);
    res.send({ admin, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// View assignments tagged to the admin
router.get('/assignments', auth, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).send({ error: 'Access denied. Admin only.' });
  }
  try {
    const assignments = await Assignment.find({ admin: req.user._id })
      .populate('userId', 'username')
      .select('userId task createdAt status');
    res.send(assignments);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Accept an assignment
router.post('/assignments/:id/accept', auth, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).send({ error: 'Access denied. Admin only.' });
  }
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, admin: req.user._id },
      { status: 'accepted' },
      { new: true }
    );
    if (!assignment) {
      return res.status(404).send({ error: 'Assignment not found' });
    }
    res.send(assignment);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Reject an assignment
router.post('/assignments/:id/reject', auth, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).send({ error: 'Access denied. Admin only.' });
  }
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, admin: req.user._id },
      { status: 'rejected' },
      { new: true }
    );
    if (!assignment) {
      return res.status(404).send({ error: 'Assignment not found' });
    }
    res.send(assignment);
  } catch (error) {
    res.status(400).send(error);
  }
});

module.exports = router;