const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(isAdmin);

// User management
router.get('/users', adminController.getAllUsers);

// Bet management
router.get('/bets', adminController.getAllBets);

// Deposit management
router.get('/deposits', adminController.getDepositRequests);
router.post('/deposits/approve', adminController.approveDeposit);
router.post('/deposits/reject', adminController.rejectDeposit);

// Withdraw management
router.get('/withdraws', adminController.getWithdrawRequests);
router.post('/withdraws/approve', adminController.approveWithdraw);
router.post('/withdraws/reject', adminController.rejectWithdraw);

// Platform stats
router.get('/stats', adminController.getPlatformStats);

module.exports = router;