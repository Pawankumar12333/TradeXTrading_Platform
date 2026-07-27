const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const gameController = require('../controllers/gameController');

// Get current game state (no auth required - for all users)
router.get('/state', gameController.getGameState);

// Place bet (requires auth)
router.post('/bet', authenticate, gameController.placeBet);

// Create deposit request (requires auth)
router.post('/deposit/request', authenticate, gameController.createDepositRequest);

// ✅ Create withdraw request (requires auth)
router.post('/withdraw/request', authenticate, gameController.createWithdrawRequest);

// Get bet history (requires auth)
router.get('/bet-history', authenticate, gameController.getBetHistory);

// Get transactions (requires auth)
router.get('/transactions', authenticate, gameController.getTransactions);

// Get leaderboard (no auth)
router.get('/leaderboard', gameController.getLeaderboard);

// Generate referral coupon (requires auth)
router.post('/generate-coupon', authenticate, gameController.generateCoupon);

// Get user stats (requires auth)
router.get('/stats', authenticate, gameController.getUserStats);

module.exports = router;