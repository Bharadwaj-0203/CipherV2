// server/src/routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Store message
router.post('/store', async (req, res) => {
  try {
    const { content, recipientId, timestamp } = req.body;
    
    const message = await Message.create({
      sender: req.user.id,
      recipient: recipientId,
      content,
      timestamp,
      status: 'sent'
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Error storing message:', error);
    res.status(500).json({
      success: false,
      message: 'Error storing message'
    });
  }
});

// Get chat history
router.get('/history/:userId', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.user.id }
      ]
    })
    .sort({ timestamp: 1 })
    .lean();

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
});

module.exports = router;