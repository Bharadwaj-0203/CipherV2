// server/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -salt -privateKey')
      .sort('username');

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user public key
router.get('/:id/publicKey', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('publicKey');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        publicKey: user.publicKey
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching public key',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get online status
router.get('/:id/status', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('lastActive');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Consider user online if active in last 5 minutes
    const isOnline = (Date.now() - user.lastActive) < 5 * 60 * 1000;

    res.json({
      success: true,
      data: {
        isOnline
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;