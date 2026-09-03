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

// ============================================
// ✅ CORS CONFIGURATION - Allow all environments
// ============================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5001',
  'https://tradexxtrading-platform.vercel.app',
  'https://tradex-frontend.vercel.app',
  'https://trading-frontend.onrender.com',
  'https://trade-x-trading-platform-uelg-111in7655c.vercel.app'
];

// Socket.io CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
  }
});

// CORS Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.warn('❌ CORS blocked for origin:', origin);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    console.log('✅ CORS allowed for origin:', origin);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Helmet with relaxed settings for development
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// ============================================
// 📍 ROUTES
// ============================================

// Root route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Trading Game API Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
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
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
console.log('📦 Loading routes...');
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

console.log('✅ Routes registered:');
console.log('   - /api/auth');
console.log('   - /api/game');
console.log('   - /api/admin');

// 404 handler for unknown routes
app.use('*', (req, res) => {
  console.log('❌ Route not found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'GET /api/auth/me',
      'PUT /api/auth/profile',
      'PUT /api/auth/change-password',
      'GET /api/game/state',
      'POST /api/game/bet',
      'GET /api/admin/users'
    ]
  });
});

// ============================================
// 🎮 SOCKET.IO CONNECTIONS
// ============================================
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);
  
  // Send current game state to new client
  socket.emit('game-state', getGlobalGameState());
  
  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ============================================
// ⏰ GAME TIMER - 12-hour candles
// ============================================
const CANDLE_DURATION_MS = 12 * 60 * 60 * 1000;

function getMsUntilNextBoundary() {
  const now = new Date();
  const next = new Date(now);

  if (now.getHours() < 12) {
    next.setHours(12, 0, 0, 0);
  } else {
    next.setDate(now.getDate() + 1);
    next.setHours(0, 0, 0, 0);
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

// ============================================
// ❌ ERROR HANDLING MIDDLEWARE
// ============================================
app.use(errorHandler);

// ============================================
// 🚀 START SERVER
// ============================================
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`========================================`);
  console.log(`\n📍 Allowed Origins:`);
  allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
  console.log(`\n📍 Available endpoints:`);
  console.log(`   - ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/`);
  console.log(`   - ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api/health`);
  console.log(`   - ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api/auth`);
  console.log(`   - ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api/game`);
  console.log(`   - ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api/admin`);
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