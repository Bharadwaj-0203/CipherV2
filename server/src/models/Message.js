const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  encrypted: {
    data: {
      type: String,
      required: true
    },
    iv: {
      type: String,
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sending'
  }
});

messageSchema.index({ sender: 1, recipient: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);