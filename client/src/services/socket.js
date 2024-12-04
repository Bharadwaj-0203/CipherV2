import { encryptionService } from './encryption';

class SocketService {
  constructor() {
    this.ws = null;
    this.token = null;
    this.handlers = new Map();
    this.isConnecting = false;
  }

  connect(token) {
    if (this.isConnecting) return Promise.resolve();

    return new Promise((resolve, reject) => {
      try {
        this.token = token;
        this.ws = new WebSocket('ws://localhost:3000');
        this.isConnecting = true;

        this.ws.onopen = () => {
          console.log('WebSocket Connected');
          this.send({ type: 'auth', token });
        };

        this.ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received message type:', data.type);

            if (data.type === 'auth_success') {
              this.isConnecting = false;
              resolve();
            }

            if (data.type === 'message' && data.encrypted) {
              data.content = await encryptionService.decryptMessage(data.encrypted.data, data.encrypted.iv);
            }

            this.handlers.get(data.type)?.forEach(handler => handler(data));

          } catch (error) {
            console.error('Message processing error:', error);
            this.handlers.get('error')?.forEach(handler => handler(error));
          }
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          console.log('WebSocket disconnected');
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  async sendMessage(recipientId, content) {
    try {
      // Ensure encryption service is initialized
      if (!encryptionService.key) {
        await encryptionService.initialize();
      }

      const encrypted = await encryptionService.encryptMessage(content);
      
      this.send({
        type: 'message',
        recipientId,
        encrypted
      });
    } catch (error) {
      console.error('Send message error:', error);
      throw error;
    }
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    this.ws.send(JSON.stringify(data));
  }

  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type).add(handler);
  }

  off(type, handler) {
    if (handler) {
      this.handlers.get(type)?.delete(handler);
    } else {
      this.handlers.delete(type);
    }
  }

  removeAllHandlers() {
    this.handlers.clear();
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.removeAllHandlers();
    this.token = null;
    this.isConnecting = false;
  }
}

export const socketService = new SocketService();