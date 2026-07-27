const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load env variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const gameRoutes = require('./src/routes/gameRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Import middleware
const { errorHandler } = require('./src/middleware/errorHandler');

// Import game service for socket
const { getGlobalGameState, updateGameState } = require('./src/services/gameService');

const app = express();
const httpServer = createServer(app);

// ✅ ALLOWED ORIGINS - Frontend ke dono ports
const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];

// ✅ Socket.io CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true
  }
});

// ✅ CORS Middleware - Allow both ports
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ✅ Handle preflight requests
app.options('*', cors());

// ✅ Helmet with relaxed settings for development
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// ✅ Root route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Trading Game API Server is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      game: '/api/game',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: ['/', '/api/health', '/api/auth', '/api/game', '/api/admin']
  });
});

// Socket.io connections
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);
  
  // Send current game state to new client
  socket.emit('game-state', getGlobalGameState());
  
  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ✅ Global game timer - candle generates exactly at 12:00 AM and 12:00 PM (12-hour candles)
// Instead of a fixed setInterval (which drifts from clock time based on when the server
// happened to start), we calculate ms remaining until the next real 12AM/12PM boundary
// and schedule a self-correcting setTimeout chain around that.
const CANDLE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours in ms

function getMsUntilNextBoundary() {
  const now = new Date();
  const next = new Date(now);

  if (now.getHours() < 12) {
    next.setHours(12, 0, 0, 0); // next boundary is 12:00 PM today
  } else {
    next.setDate(now.getDate() + 1);
    next.setHours(0, 0, 0, 0); // next boundary is 12:00 AM tomorrow
  }

  return Math.max(1000, next.getTime() - now.getTime());
}

let gameTimeout = null;

const runCandleCycle = () => {
  const newState = updateGameState();
  io.emit('game-update', newState);
  console.log('🎮 Game state updated:', newState.currentCandle);

  scheduleNextCandle();
};

const scheduleNextCandle = () => {
  if (gameTimeout) clearTimeout(gameTimeout);
  const delay = getMsUntilNextBoundary();
  console.log(`⏰ Next candle scheduled in ${(delay / 1000 / 60 / 60).toFixed(2)} hours (at next 12:00 AM/PM)`);
  gameTimeout = setTimeout(runCandleCycle, delay);
};

const startGameInterval = () => {
  scheduleNextCandle();
};

startGameInterval();

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`========================================`);
  console.log(`\n📍 Allowed Origins:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log(`\n📍 Available endpoints:`);
  console.log(`   - http://localhost:${PORT}/`);
  console.log(`   - http://localhost:${PORT}/api/health`);
  console.log(`   - http://localhost:${PORT}/api/auth`);
  console.log(`   - http://localhost:${PORT}/api/game`);
  console.log(`   - http://localhost:${PORT}/api/admin`);
  console.log(`\n========================================\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  if (gameTimeout) clearTimeout(gameTimeout);
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});