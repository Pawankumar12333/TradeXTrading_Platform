import io from 'socket.io-client';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const connectSocket = () => {
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  socket = io('http://localhost:5001', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected successfully:', socket.id);
    reconnectAttempts = 0;
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
  });

  return socket;
};

export const getSocket = () => {
  if (!socket || !socket.connected) {
    console.log('Socket not connected, creating new connection');
    return connectSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};

// Game state listener
export const onGameUpdate = (callback) => {
  const socket = getSocket();
  socket.on('game-update', (data) => {
    console.log('📡 Game update received:', data);
    callback(data);
  });
  return () => {
    socket.off('game-update');
    console.log('Removed game-update listener');
  };
};

export const onGameState = (callback) => {
  const socket = getSocket();
  socket.on('game-state', (data) => {
    console.log('🎮 Game state received:', data);
    callback(data);
  });
  return () => {
    socket.off('game-state');
    console.log('Removed game-state listener');
  };
};

// Send game action (like placing bet)
export const emitGameAction = (event, data) => {
  const socket = getSocket();
  socket.emit(event, data);
  console.log(`📤 Emitted ${event}:`, data);
};

// Check connection status
export const isSocketConnected = () => {
  return socket && socket.connected;
};

export default {
  connectSocket,
  getSocket,
  disconnectSocket,
  onGameUpdate,
  onGameState,
  emitGameAction,
  isSocketConnected
};