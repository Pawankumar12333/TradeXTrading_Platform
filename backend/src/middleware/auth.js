const jwt = require('jsonwebtoken');

// Load UserModel with fallback
let UserModel;
try {
  const UserModelModule = require('../models/userModel');
  UserModel = UserModelModule.UserModel || UserModelModule;
  console.log('✅ Auth middleware: UserModel loaded successfully');
} catch (err) {
  console.error('❌ Auth middleware: Failed to load UserModel:', err.message);
  UserModel = null;
}

const HARDCODED_ADMIN = {
  id: 1,
  unique_id: 9807548664,
  name: 'Admin',
  email: 'admin@tradinggame.com',
  is_admin: true
};

// ============================================
// ✅ AUTHENTICATE
// ============================================
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    console.log('🔐 Authenticate request:', {
      hasToken: !!token,
      path: req.path,
      method: req.method
    });
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required. Please login.' 
      });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      console.log('✅ Token verified for user:', decoded.id);
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid or expired token. Please login again.' 
      });
    }
    
    if (decoded.uniqueId === 9807548664 || decoded.id === 1) {
      console.log('✅ Hardcoded admin authenticated');
      req.user = {
        id: HARDCODED_ADMIN.id,
        uniqueId: HARDCODED_ADMIN.unique_id,
        name: HARDCODED_ADMIN.name,
        email: HARDCODED_ADMIN.email,
        isAdmin: true
      };
      return next();
    }
    
    if (!UserModel) {
      console.log('⚠️ UserModel not available, using decoded token data');
      req.user = {
        id: decoded.id,
        uniqueId: decoded.uniqueId || decoded.unique_id,
        name: decoded.name || 'User',
        email: decoded.email,
        isAdmin: decoded.isAdmin || decoded.is_admin || false
      };
      return next();
    }
    
    try {
      const user = await UserModel.getById(decoded.id);
      
      if (!user) {
        console.log('❌ User not found in database:', decoded.id);
        return res.status(401).json({ 
          success: false,
          error: 'User not found. Please login again.' 
        });
      }
      
      console.log('✅ User authenticated:', {
        id: user.id,
        uniqueId: user.unique_id,
        email: user.email,
        isAdmin: user.is_admin
      });
      
      req.user = {
        id: user.id,
        uniqueId: user.unique_id || user.uniqueId,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        isAdmin: user.is_admin || user.isAdmin || false
      };
      
      next();
    } catch (dbError) {
      console.error('❌ Database error in auth:', dbError.message);
      req.user = {
        id: decoded.id,
        uniqueId: decoded.uniqueId || decoded.unique_id,
        name: decoded.name || 'User',
        email: decoded.email,
        isAdmin: decoded.isAdmin || decoded.is_admin || false
      };
      console.log('⚠️ Using fallback user data from token');
      next();
    }
    
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication failed. Please try again.' 
    });
  }
};

// ============================================
// ✅ IS ADMIN
// ============================================
const isAdmin = async (req, res, next) => {
  try {
    console.log('🔐 Admin check for user:', req.user?.id);
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }
    
    if (req.user.uniqueId === 9807548664 || req.user.id === 1) {
      console.log('✅ Hardcoded admin access granted');
      return next();
    }
    
    if (!req.user.isAdmin) {
      console.log('❌ Admin access denied for user:', req.user.id);
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required' 
      });
    }
    
    console.log('✅ Admin access granted for user:', req.user.id);
    next();
    
  } catch (error) {
    console.error('❌ Admin check error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Admin verification failed' 
    });
  }
};

// ============================================
// ✅ OPTIONAL AUTH
// ============================================
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
      
      if (decoded.uniqueId === 9807548664 || decoded.id === 1) {
        req.user = {
          id: HARDCODED_ADMIN.id,
          uniqueId: HARDCODED_ADMIN.unique_id,
          name: HARDCODED_ADMIN.name,
          email: HARDCODED_ADMIN.email,
          isAdmin: true
        };
        return next();
      }
      
      if (UserModel) {
        const user = await UserModel.getById(decoded.id);
        if (user) {
          req.user = {
            id: user.id,
            uniqueId: user.unique_id || user.uniqueId,
            name: user.name,
            email: user.email,
            isAdmin: user.is_admin || user.isAdmin || false
          };
        } else {
          req.user = null;
        }
      } else {
        req.user = {
          id: decoded.id,
          uniqueId: decoded.uniqueId || decoded.unique_id,
          name: decoded.name || 'User',
          email: decoded.email,
          isAdmin: decoded.isAdmin || decoded.is_admin || false
        };
      }
    } catch (err) {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = { 
  authenticate, 
  isAdmin,
  optionalAuth 
};