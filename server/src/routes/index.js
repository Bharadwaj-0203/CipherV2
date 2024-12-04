//server/src/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const messageRoutes = require('./messageRoutes');
const errorHandler = require('../middleware/errorHandler');

router.use('/auth', authRoutes);
router.use('/messages', messageRoutes);

// Health check route
router.get('/health', (_, res) => {
  res.json({ status: 'healthy' });
});

// Error handling
router.use(errorHandler);

module.exports = router;