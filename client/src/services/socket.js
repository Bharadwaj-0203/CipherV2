// src/services/socket.js
class SocketService {
  constructor() {
    this.ws = null;
    this.token = null;
    this.handlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnecting = false;
  }

  connect(token) {
    if (this.isConnecting) return Promise.resolve();

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        this.token = token;
        this.ws = new WebSocket('ws://localhost:3000');

        this.ws.onopen = () => {
          console.log('WebSocket Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.send({
            type: 'auth',
            token: this.token
          });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received:', data);

            const handlers = this.handlers.get(data.type) || [];
            handlers.forEach(handler => handler(data));
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket Disconnected');
          this.isConnecting = false;
          if (!this.manualDisconnect) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket Error:', error);
          this.isConnecting = false;
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.token) return;

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (!this.manualDisconnect) {
        this.connect(this.token).catch(console.error);
      }
    }, 2000);
  }

  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  removeAllHandlers() {
    this.handlers.clear();
  }

  disconnect() {
    this.manualDisconnect = true;
    this.removeAllHandlers();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.token = null;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }
}

export const socketService = new SocketService();