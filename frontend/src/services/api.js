import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

console.log('🚀 API Base URL:', API_BASE_URL);

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true
});

// Request interceptor - Add token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIS ====================
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);
export const forgotPassword = (data) => API.post('/auth/forgot-password', data);
export const resetPassword = (data) => API.post('/auth/reset-password', data);
export const getCurrentUser = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const changePassword = (data) => API.put('/auth/change-password', data);

// ==================== GAME APIS ====================
export const getGameState = () => API.get('/game/state');
export const placeBet = (data) => API.post('/game/bet', data);
export const createDepositRequest = (data) => API.post('/game/deposit/request', data);
export const createWithdrawRequest = (data) => API.post('/game/withdraw/request', data);
export const getBetHistory = () => API.get('/game/bet-history');
export const getTransactions = () => API.get('/game/transactions');
export const getLeaderboard = () => API.get('/game/leaderboard');
export const generateCoupon = () => API.post('/game/generate-coupon');
export const getUserStats = () => API.get('/game/stats');

// ==================== ADMIN APIS ====================
export const getAllUsers = () => API.get('/admin/users');
export const getAllBets = () => API.get('/admin/bets');
export const getDepositRequests = () => API.get('/admin/deposits');
export const approveDeposit = (data) => API.post('/admin/deposits/approve', data);
export const rejectDeposit = (data) => API.post('/admin/deposits/reject', data);
export const getWithdrawRequests = () => API.get('/admin/withdraws');
export const approveWithdraw = (data) => API.post('/admin/withdraws/approve', data);
export const rejectWithdraw = (data) => API.post('/admin/withdraws/reject', data);
export const getPlatformStats = () => API.get('/admin/stats');

export default API;