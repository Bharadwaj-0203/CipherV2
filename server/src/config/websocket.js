// server/src/config/websocket.js

const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    this.heartbeatInterval = 30000; // 30 seconds
    this.initialize();
  }

  initialize() {
    console.log('Initializing WebSocket Server');

    this.wss.on('connection', async (ws) => {
      let userId = null;
      console.log('New client attempting connection');

      const connectionTimeout = setTimeout(() => {
        if (!userId) {
          console.log('Connection timeout - no authentication received');
          ws.close(4001, 'Authentication timeout');
        }
      }, 10000);

      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          console.log('Received message type:', message.type);

          switch (message.type) {
            case 'auth':
              try {
                clearTimeout(connectionTimeout);
                const decoded = jwt.verify(message.token, process.env.JWT_SECRET);
                userId = decoded.id;

                const user = await User.findById(userId);
                if (!user) {
                  ws.close(4002, 'User not found');
                  return;
                }

                // Update user status
                await User.findByIdAndUpdate(userId, {
                  isOnline: true,
                  lastActive: new Date()
                });

                this.clients.set(userId, {
                  ws,
                  user: {
                    id: user._id,
                    username: user.username
                  }
                });

                console.log(`User ${user.username} authenticated successfully`);
                
                ws.send(JSON.stringify({
                  type: 'auth_success',
                  user: {
                    id: user._id,
                    username: user.username
                  }
                }));

                // Send message history
                await this.sendMessageHistory(userId);
                await this.broadcastUserList();
              } catch (error) {
                console.error('Authentication error:', error);
                ws.close(4003, 'Authentication failed');
              }
              break;
            
            case 'message':
              if (!userId || !this.clients.has(userId)) {
                ws.close(4004, 'Unauthorized');
                return;
              }
              await this.handleMessage(userId, message);
              break;

            case 'typing':
              if (!userId || !this.clients.has(userId)) {
                ws.close(4004, 'Unauthorized');
                return;
              }
              await this.handleTyping(userId, message);
              break;
          }
        } catch (error) {
          console.error('Message processing error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Failed to process message'
          }));
        }
      });

      ws.on('close', async () => {
        if (userId) {
          console.log(`Client disconnected: ${userId}`);
          this.clients.delete(userId);
          
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastActive: new Date()
          });

          await this.broadcastUserList();
        }
        clearTimeout(connectionTimeout);
      });

      ws.on('error', async (error) => {
        console.error('WebSocket error:', error);
        if (userId) {
          this.clients.delete(userId);
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastActive: new Date()
          });
          await this.broadcastUserList();
        }
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, this.heartbeatInterval);
  }

  async handleMessage(senderId, message) {
    try {
      const { recipientId, encrypted } = message;
      
      if (!encrypted || !encrypted.data || !encrypted.iv) {
        throw new Error('Missing encryption data');
      }
      
      const messageDoc = await Message.create({
        sender: senderId,
        recipient: recipientId,
        encrypted: {
          data: encrypted.data,
          iv: encrypted.iv
        },
        status: 'sent'
      });

      const messageData = {
        type: 'message',
        messageId: messageDoc._id.toString(),
        senderId,
        recipientId,
        encrypted,
        timestamp: messageDoc.timestamp,
        status: 'sent'
      };

      // Send to recipient if online
      const recipientClient = this.clients.get(recipientId);
      if (recipientClient?.ws.readyState === WebSocket.OPEN) {
        recipientClient.ws.send(JSON.stringify(messageData));
        messageDoc.status = 'delivered';
        await messageDoc.save();
        messageData.status = 'delivered';
      }

      // Send confirmation to sender
      const senderClient = this.clients.get(senderId);
      if (senderClient?.ws.readyState === WebSocket.OPEN) {
        senderClient.ws.send(JSON.stringify({
          type: 'message_confirmation',
          ...messageData
        }));
      }

    } catch (error) {
      console.error('Error handling message:', error);
      const senderClient = this.clients.get(senderId);
      if (senderClient?.ws.readyState === WebSocket.OPEN) {
        senderClient.ws.send(JSON.stringify({
          type: 'error',
          error: 'Failed to send message'
        }));
      }
    }
  }

  async handleTyping(senderId, message) {
    const recipientClient = this.clients.get(message.recipientId);
    if (recipientClient?.ws.readyState === WebSocket.OPEN) {
      recipientClient.ws.send(JSON.stringify({
        type: 'typing',
        senderId,
        isTyping: message.isTyping
      }));
    }
  }

  async sendMessageHistory(userId) {
    try {
      const messages = await Message.find({
        $or: [
          { sender: userId },
          { recipient: userId }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

      const client = this.clients.get(userId);
      if (client?.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: 'message_history',
          messages: messages.reverse()
        }));
      }
    } catch (error) {
      console.error('Error sending message history:', error);
    }
  }

  async broadcastUserList() {
    try {
      const users = await User.find({})
        .select('username isOnline lastActive');
      
      const userList = users.map(user => ({
        id: user._id.toString(),
        username: user.username,
        isOnline: this.clients.has(user._id.toString()),
        lastActive: user.lastActive
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