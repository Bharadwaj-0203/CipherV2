//server/src/messageRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.get('/all', protect, messageController.getAllMessages);

module.exports = router;