require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const alertRoutes = require('./routes/alerts');
const { initializeDatabase } = require('./db/database');
const { broadcastAlert } = require('./services/alertService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Store io instance globally
global.io = io;

// Inicializar banco de dados
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket Connection
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Usuário conectado: ${socket.id}`);
  
  socket.emit('user:connected', {
    message: 'Conectado ao sistema de alertas',
    userId: socket.id,
    timestamp: new Date().toISOString()
  });

  socket.on('alert:subscribe', (data) => {
    console.log(`[${new Date().toISOString()}] Usuário ${socket.id} se inscreveu em alertas`);
    socket.emit('alert:ready', { message: 'Pronto para receber alertas' });
  });

  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] Usuário desconectado: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] Erro no socket ${socket.id}:`, error);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║  CellBroadcast Kyby Backend Started    ║`);
  console.log(`║  Servidor rodando em: http://localhost:${PORT} ║`);
  console.log(`║  WebSocket: ws://localhost:${PORT}    ║`);
  console.log(`╚════════════════════════════════════════╝\n`);
});

module.exports = { app, server, io };
