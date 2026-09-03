const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOTP, generateUniqueId } = require('../utils/helpers');

// Load UserModel
let UserModel;
try {
  const UserModelModule = require('../models/userModel');
  UserModel = UserModelModule.UserModel || UserModelModule;
  console.log('✅ UserModel loaded successfully');
} catch (err) {
  console.error('❌ Failed to load UserModel:', err.message);
  UserModel = null;
}

// Store OTPs temporarily
const otpStore = new Map();

// Hardcoded admin for testing
const HARDCODED_ADMIN = {
  id: 1,
  unique_id: 9807548664,
  name: 'Admin',
  mobile: '9807548664',
  email: 'admin@tradinggame.com',
  password: '@@@@Admin@123',
  gender: 'male',
  balance: 10000,
  is_admin: true
};

// ============================================
// ✅ REGISTER
// ============================================
const register = async (req, res) => {
  try {
    const { name, mobile, email, password, gender, referralCoupon } = req.body;
    
    console.log('========================================');
    console.log('📝 REGISTRATION ATTEMPT:');
    console.log('   Name:', name);
    console.log('   Mobile:', mobile);
    console.log('   Email:', email);
    console.log('========================================');
    
    // Validation
    if (!name || !mobile || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'All fields are required' 
      });
    }
    
    if (mobile.length !== 10) {
      return res.status(400).json({ 
        success: false,
        error: 'Mobile number must be 10 digits' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 6 characters' 
      });
    }
    
    // Check if UserModel is available
    if (!UserModel) {
      console.log('⚠️ UserModel not available, using mock registration');
      const uniqueId = generateUniqueId();
      const token = jwt.sign(
        { id: Date.now(), uniqueId, email },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '7d' }
      );
      
      return res.json({
        success: true,
        message: 'Registration successful (mock mode)',
        token,
        user: {
          id: Date.now(),
          uniqueId,
          name,
          mobile,
          email,
          gender: gender || 'prefer_not_to_say',
          balance: 100,
          isAdmin: false
        }
      });
    }
    
    // Check if user exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Email already registered' 
      });
    }
    
    const existingMobile = await UserModel.findByMobile(mobile);
    if (existingMobile) {
      return res.status(400).json({ 
        success: false,
        error: 'Mobile number already registered' 
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate unique ID
    const uniqueId = generateUniqueId();
    
    // Create user
    const newUser = await UserModel.create({
      uniqueId,
      name,
      mobile,
      email,
      password: hashedPassword,
      gender: gender || 'prefer_not_to_say',
      balance: 100,
      is_admin: false
    });

    if (!newUser) {
      throw new Error('Failed to create user');
    }

    // Generate token
    const token = jwt.sign(
      { id: newUser.id, uniqueId: newUser.unique_id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    console.log('✅ Registration successful:', { uniqueId, email });

    res.json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: newUser.id,
        uniqueId: newUser.unique_id,
        name: newUser.name,
        mobile: newUser.mobile,
        email: newUser.email,
        gender: newUser.gender || 'prefer_not_to_say',
        balance: newUser.balance || 0,
        isAdmin: newUser.is_admin || false
      }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Registration failed' 
    });
  }
};

// ============================================
// ✅ LOGIN
// ============================================
const login = async (req, res) => {
  try {
    const { loginValue, password } = req.body;
    
    console.log('========================================');
    console.log('🔐 LOGIN ATTEMPT:');
    console.log('   Login Value:', loginValue);
    console.log('   Password:', password ? '***' : 'missing');
    console.log('========================================');
    
    if (!loginValue || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Mobile/Email and password are required' 
      });
    }
    
    // Check hardcoded admin login
    if (loginValue === '9807548664' && password === '@@@@Admin@123') {
      console.log('✅ Admin login successful (hardcoded)');
      
      const token = jwt.sign(
        { 
          id: HARDCODED_ADMIN.id, 
          uniqueId: HARDCODED_ADMIN.unique_id, 
          email: HARDCODED_ADMIN.email 
        },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '7d' }
      );
      
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: HARDCODED_ADMIN.id,
          uniqueId: HARDCODED_ADMIN.unique_id,
          name: HARDCODED_ADMIN.name,
          mobile: HARDCODED_ADMIN.mobile,
          email: HARDCODED_ADMIN.email,
          gender: HARDCODED_ADMIN.gender,
          balance: HARDCODED_ADMIN.balance,
          isAdmin: true
        }
      });
    }
    
    // If UserModel is not available
    if (!UserModel) {
      console.log('❌ UserModel not available and not admin login');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Find user
    const user = await UserModel.findByLogin(loginValue);
    
    if (!user) {
      console.log('❌ User not found:', loginValue);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    console.log('✅ User found:', {
      id: user.id,
      mobile: user.mobile,
      email: user.email,
      name: user.name
    });
    
    // Compare password
    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (compareError) {
      console.error('Password compare error:', compareError);
      isPasswordValid = (password === user.password);
    }
    
    console.log('   Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        id: user.id, 
        uniqueId: user.unique_id, 
        email: user.email 
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );
    
    console.log('✅ Login successful:', { uniqueId: user.unique_id, name: user.name });
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        uniqueId: user.unique_id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        gender: user.gender || 'prefer_not_to_say',
        balance: user.balance || 0,
        isAdmin: user.is_admin || false
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed: ' + error.message 
    });
  }
};

// ============================================
// ✅ GET CURRENT USER
// ============================================
const getCurrentUser = async (req, res) => {
  try {
    console.log('👤 Getting current user:', req.user?.id);
    
    if (req.user && req.user.uniqueId === 9807548664) {
      return res.json({
        success: true,
        user: {
          id: 1,
          uniqueId: 9807548664,
          name: 'Admin',
          mobile: '9807548664',
          email: 'admin@tradinggame.com',
          gender: 'male',
          balance: 10000,
          isAdmin: true
        }
      });
    }
    
    if (!UserModel) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    const user = await UserModel.getById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        uniqueId: user.unique_id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        gender: user.gender || 'prefer_not_to_say',
        balance: user.balance || 0,
        isAdmin: user.is_admin || false
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get user' 
    });
  }
};

// ============================================
// ✅ FORGOT PASSWORD
// ============================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('🔐 Forgot password request for:', email);
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required' 
      });
    }
    
    if (email === 'admin@tradinggame.com') {
      const otp = generateOTP();
      otpStore.set(`reset_${email}`, {
        email,
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000
      });
      console.log(`🔐 Reset OTP for admin ${email}: ${otp}`);
      return res.json({ 
        success: true, 
        message: 'Reset OTP sent to your email',
        dev_otp: otp 
      });
    }
    
    if (!UserModel) {
      return res.status(404).json({ 
        success: false,
        error: 'No account found with this email' 
      });
    }
    
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'No account found with this email' 
      });
    }
    
    const otp = generateOTP();
    
    otpStore.set(`reset_${email}`, {
      email,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    console.log(`🔐 Reset OTP for ${email}: ${otp}`);
    console.log('⚠️ In production, this OTP would be sent via email');
    
    res.json({ 
      success: true, 
      message: 'Reset OTP sent to your email',
      dev_otp: otp 
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send reset OTP' 
    });
  }
};

// ============================================
// ✅ RESET PASSWORD
// ============================================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    console.log('🔑 Reset password request for:', email);
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Email, OTP, and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'Password must be at least 6 characters' 
      });
    }
    
    const storedData = otpStore.get(`reset_${email}`);
    
    if (!storedData || storedData.expiresAt < Date.now()) {
      return res.status(400).json({ 
        success: false,
        error: 'OTP expired or invalid' 
      });
    }
    
    if (storedData.otp !== otp) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid OTP' 
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    if (email === 'admin@tradinggame.com') {
      otpStore.delete(`reset_${email}`);
      console.log('✅ Password reset successful for admin (mock)');
      return res.json({ 
        success: true, 
        message: 'Password reset successful' 
      });
    }
    
    if (!UserModel) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    await UserModel.updatePassword(user.unique_id, hashedPassword);
    
    otpStore.delete(`reset_${email}`);
    
    console.log('✅ Password reset successful for:', email);
    
    res.json({ 
      success: true, 
      message: 'Password reset successful' 
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to reset password' 
    });
  }
};

// ============================================
// ✅ UPDATE PROFILE
// ============================================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, gender } = req.body;
    
    console.log('📝 Update profile for user:', userId);
    
    if (!UserModel) {
      return res.status(404).json({ 
        success: false,
        error: 'User service not available' 
      });
    }
    
    const updatedUser = await UserModel.update(userId, {
      name,
      email,
      gender
    });
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        uniqueId: updatedUser.unique_id,
        name: updatedUser.name,
        mobile: updatedUser.mobile,
        email: updatedUser.email,
        gender: updatedUser.gender,
        balance: updatedUser.balance,
        isAdmin: updatedUser.is_admin
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile' 
    });
  }
};

// ============================================
// ✅ CHANGE PASSWORD
// ============================================
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    console.log('🔑 Change password for user:', userId);
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Current password and new password are required' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        error: 'New password must be at least 6 characters' 
      });
    }
    
    if (!UserModel) {
      return res.status(404).json({ 
        success: false,
        error: 'User service not available' 
      });
    }
    
    const user = await UserModel.getById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Current password is incorrect' 
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    await UserModel.updatePassword(user.unique_id, hashedPassword);
    
    console.log('✅ Password changed successfully for user:', userId);
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to change password' 
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword
};