// server/src/config/websocket.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    this.initialize();
  }

  initialize() {
    console.log('Initializing WebSocket Server');

    this.wss.on('connection', async (ws) => {
      console.log('New client attempting connection');
      let userId = null;

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          console.log('Received message:', message);

          if (message.type === 'auth') {
            const decoded = jwt.verify(message.token, process.env.JWT_SECRET);
            userId = decoded.id;

            const user = await User.findById(userId);
            if (!user) {
              ws.close();
              return;
            }

            // Store client connection
            this.clients.set(userId, { ws, user });
            
            ws.send(JSON.stringify({ 
              type: 'auth_success',
              user: { id: user._id, username: user.username }
            }));

            // Update user status and broadcast user list
            await User.findByIdAndUpdate(userId, { isOnline: true });
            await this.broadcastUserList();

            return;
          }

          // For non-auth messages, verify we have a valid userId
          if (!userId || !this.clients.has(userId)) {
            console.log('Invalid user trying to send message');
            return;
          }

          switch (message.type) {
            case 'message':
              await this.handleMessage(userId, message);
              break;
            case 'typing':
              await this.handleTyping(userId, message);
              break;
          }

        } catch (error) {
          console.error('Message processing error:', error);
        }
      });

      ws.on('close', async () => {
        if (userId) {
          console.log('Client disconnected:', userId);
          this.clients.delete(userId);
          await User.findByIdAndUpdate(userId, { isOnline: false });
          await this.broadcastUserList();
        }
      });
    });
  }

  async handleMessage(senderId, message) {
    try {
      console.log(`Handling message from ${senderId} to ${message.recipientId}`);
      
      const messageDoc = await Message.create({
        sender: senderId,
        recipient: message.recipientId,
        content: message.content,
        timestamp: new Date()
      });

      const messageData = {
        type: 'message',
        messageId: messageDoc._id.toString(),
        senderId: senderId,
        recipientId: message.recipientId,
        content: message.content,
        timestamp: messageDoc.timestamp
      };

      // Send to recipient
      const recipientWs = this.clients.get(message.recipientId)?.ws;
      if (recipientWs?.readyState === WebSocket.OPEN) {
        console.log('Sending message to recipient');
        recipientWs.send(JSON.stringify(messageData));
      }

      // Confirm to sender
      const senderWs = this.clients.get(senderId)?.ws;
      if (senderWs?.readyState === WebSocket.OPEN) {
        console.log('Sending confirmation to sender');
        senderWs.send(JSON.stringify({
          ...messageData,
          status: 'sent'
        }));
      }

    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  async handleTyping(senderId, message) {
    const recipientWs = this.clients.get(message.recipientId)?.ws;
    if (recipientWs?.readyState === WebSocket.OPEN) {
      recipientWs.send(JSON.stringify({
        type: 'typing',
        senderId,
        isTyping: message.isTyping
      }));
    }
  }

  async broadcastUserList() {
    try {
      const users = await User.find({}).select('username isOnline').lean();
      
      const userList = users.map(user => ({
        id: user._id.toString(),
        username: user.username,
        isOnline: this.clients.has(user._id.toString())
      }));

      const message = JSON.stringify({
        type: 'user_list',
        users: userList
      });

      this.clients.forEach(({ ws }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    } catch (error) {
      console.error('Error broadcasting user list:', error);
    }
  }
}

module.exports = (server) => new WebSocketServer(server);