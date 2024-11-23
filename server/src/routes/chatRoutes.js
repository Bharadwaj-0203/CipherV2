// src/routes/chatRoutes.js
const express = require('express');
const { sendMessage, getMessages, verifyToken } = require('../controllers/chatController');

const router = express.Router();

// Protect all routes with token verification
router.use(verifyToken);

// Routes
router.get('/messages', getMessages);
router.post('/send', sendMessage);

module.exports = router;