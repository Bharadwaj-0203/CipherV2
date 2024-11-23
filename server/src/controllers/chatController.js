// src/controllers/chatController.js
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const message = await Message.create({
            sender: req.userId,
            content
        });

        await message.populate('sender', 'username');
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const messages = await Message.find()
            .populate('sender', 'username')
            .sort({ timestamp: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    verifyToken,
    sendMessage,
    getMessages
};