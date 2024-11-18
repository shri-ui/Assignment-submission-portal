const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');

const router = express.Router();

// Add this near the top of the file
router.get('/test', (req, res) => {
  res.send('User routes are working');
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user || !(await user.comparePassword(req.body.password))) {
      return res.status(401).send({ error: 'Invalid login credentials' });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// Upload an assignment
router.post('/upload', auth, async (req, res) => {
  try {
    const assignment = new Assignment({
      ...req.body,
      userId: req.user._id,
    });
    await assignment.save();
    res.status(201).send(assignment);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Fetch all admins
router.get('/admins', auth, async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true }, 'username');
    res.send(admins);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;