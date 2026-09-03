const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, isAdmin, optionalAuth } = require('../middleware/auth');

console.log('✅ Auth routes loaded successfully');

// ============================================
// 📝 PUBLIC ROUTES
// ============================================

router.post('/register', (req, res, next) => {
  console.log('📝 [REGISTER] Request received:', {
    mobile: req.body.mobile,
    email: req.body.email,
    name: req.body.name
  });
  next();
}, authController.register);

router.post('/login', (req, res, next) => {
  console.log('🔐 [LOGIN] Request received for:', req.body.loginValue || req.body.login);
  next();
}, authController.login);

router.post('/forgot-password', (req, res, next) => {
  console.log('📧 [FORGOT PASSWORD] Request for:', req.body.email);
  next();
}, authController.forgotPassword);

router.post('/reset-password', (req, res, next) => {
  console.log('🔑 [RESET PASSWORD] Request for:', req.body.email);
  next();
}, authController.resetPassword);

// ============================================
// 🔒 PROTECTED ROUTES
// ============================================

router.get('/me', authenticate, (req, res, next) => {
  console.log('👤 [GET ME] User ID:', req.user?.id);
  next();
}, authController.getCurrentUser);

router.put('/profile', authenticate, (req, res, next) => {
  console.log('📝 [UPDATE PROFILE] User ID:', req.user?.id);
  next();
}, authController.updateProfile);

router.put('/change-password', authenticate, (req, res, next) => {
  console.log('🔑 [CHANGE PASSWORD] User ID:', req.user?.id);
  next();
}, authController.changePassword);

// ============================================
// 👑 ADMIN ROUTES
// ============================================

router.get('/admin/users', authenticate, isAdmin, (req, res) => {
  res.json({ 
    success: true,
    message: 'Admin users list',
    users: []
  });
});

// ============================================
// ❌ 404 HANDLER
// ============================================
router.use('*', (req, res) => {
  console.log('❌ Auth route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Auth route not found',
    path: req.originalUrl,
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/forgot-password',
      'POST /api/auth/reset-password',
      'GET /api/auth/me',
      'PUT /api/auth/profile',
      'PUT /api/auth/change-password',
      'GET /api/auth/admin/users'
    ]
  });
});

module.exports = router;