//src/controllers/messageControoler.js
const Message = require('../models/Message');

exports.getAllMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Fetch messages where the user is either the sender or recipient
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    }).sort({ timestamp: 1 });

    // Group messages by chat ID
    const messagesByChat = messages.reduce((acc, message) => {
      const chatId = message.sender.toString() === userId.toString()
        ? message.recipient.toString()
        : message.sender.toString();

      if (!acc[chatId]) {
        acc[chatId] = [];
      }

      // Push the message details, including encrypted content and IV
      acc[chatId].push({
        id: message._id,
        content: message.encrypted.data,
        iv: message.encrypted.iv,  // Include IV for decryption
        sender: message.sender,
        timestamp: message.timestamp,
        status: message.status
      });

      return acc;
    }, {});

    // Respond with the organized messages
    res.json({ success: true, data: messagesByChat });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
};