// server/src/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const routes = require('./routes');
const setupWebSocket = require('./config/websocket');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api', routes);

// Connect DB & Start Server
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;
    setupWebSocket(server);
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
};

startServer();