import axios from 'axios';

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000
});

// Add token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIS ====================

// Register new user (direct registration)
export const register = (data) => API.post('/auth/register', data);

// Login user
export const login = (data) => API.post('/auth/login', data);

// Forgot password - send OTP
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);

// Reset password with OTP
export const resetPassword = (data) => API.post('/auth/reset-password', data);

// Get current user info
export const getCurrentUser = () => API.get('/auth/me');

// ==================== GAME APIS ====================

// Get current game state
export const getGameState = () => API.get('/game/state');

// Place bet
export const placeBet = (data) => API.post('/game/bet', data);

// Create deposit request (with screenshot)
export const createDepositRequest = (data) => API.post('/game/deposit/request', data);

// Create withdraw request
export const createWithdrawRequest = (data) => API.post('/game/withdraw/request', data);

// Get user bet history
export const getBetHistory = () => API.get('/game/bet-history');

// Get user transactions
export const getTransactions = () => API.get('/game/transactions');

// Get leaderboard
export const getLeaderboard = () => API.get('/game/leaderboard');

// Generate referral coupon
export const generateCoupon = () => API.post('/game/generate-coupon');

// Get user statistics
export const getUserStats = () => API.get('/game/stats');

// ==================== ADMIN APIS ====================

// Get all users (admin only)
export const getAllUsers = () => API.get('/admin/users');

// Get all bets (admin only)
export const getAllBets = () => API.get('/admin/bets');

// Get deposit requests (admin only)
export const getDepositRequests = () => API.get('/admin/deposits');

// Approve deposit request (admin only)
export const approveDeposit = (data) => API.post('/admin/deposits/approve', data);

// Reject deposit request (admin only)
export const rejectDeposit = (data) => API.post('/admin/deposits/reject', data);

// Get withdraw requests (admin only)
export const getWithdrawRequests = () => API.get('/admin/withdraws');

// Approve withdraw request (admin only)
export const approveWithdraw = (data) => API.post('/admin/withdraws/approve', data);

// Reject withdraw request (admin only)
export const rejectWithdraw = (data) => API.post('/admin/withdraws/reject', data);

// Get platform statistics (admin only)
export const getPlatformStats = () => API.get('/admin/stats');

export default API;