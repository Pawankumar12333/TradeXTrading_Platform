const { createClient } = require('@supabase/supabase-js');

// ============================================
// ✅ LOAD ENVIRONMENT VARIABLES
// ============================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================
// ✅ VALIDATE CREDENTIALS
// ============================================
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing! Please check .env file');
  console.error('   Required variables:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_ANON_KEY');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY (optional but recommended)');
}

// ============================================
// ✅ CREATE SUPABASE CLIENTS
// ============================================
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  db: {
    schema: 'public'
  }
});

const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public'
      }
    })
  : supabase;

// ============================================
// ✅ TABLE VALIDATION
// ============================================
const getTableNames = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('❌ Table "users" not found or inaccessible:', error.message);
      return false;
    }
    console.log('✅ Table "users" is accessible');
    return true;
  } catch (error) {
    console.error('❌ Table validation error:', error.message);
    return false;
  }
};

// ============================================
// ✅ CONNECTION TEST
// ============================================
const testConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connected successfully');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Using: ${supabaseServiceKey ? 'Service Role Key' : 'Anon Key'}`);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

// ============================================
// ✅ CHECK AUTH STATUS
// ============================================
const checkAuth = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('⚠️ Auth check:', error.message);
      return false;
    }
    console.log('✅ Auth check: Session available');
    return true;
  } catch (error) {
    console.log('⚠️ Auth check error:', error.message);
    return false;
  }
};

// ============================================
// ✅ USER OPERATIONS
// ============================================
const getUserById = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('❌ Error getting user by ID:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error('❌ getUserById error:', error.message);
    return null;
  }
};

const getUserByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error) {
      console.error('❌ Error getting user by email:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error('❌ getUserByEmail error:', error.message);
    return null;
  }
};

const getUserByMobile = async (mobile) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('mobile', mobile)
      .single();
      
    if (error) {
      console.error('❌ Error getting user by mobile:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error('❌ getUserByMobile error:', error.message);
    return null;
  }
};

const getUserByLogin = async (loginValue) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`mobile.eq.${loginValue},email.eq.${loginValue}`)
      .maybeSingle();
      
    if (error) {
      console.error('❌ Error getting user by login:', error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error('❌ getUserByLogin error:', error.message);
    return null;
  }
};

const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error creating user:', error.message);
      return null;
    }
    console.log('✅ User created successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ createUser error:', error.message);
    return null;
  }
};

const updateUser = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error updating user:', error.message);
      return null;
    }
    console.log('✅ User updated successfully:', userId);
    return data;
  } catch (error) {
    console.error('❌ updateUser error:', error.message);
    return null;
  }
};

const updateUserPassword = async (userId, hashedPassword) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error updating password:', error.message);
      return null;
    }
    console.log('✅ Password updated successfully for user:', userId);
    return data;
  } catch (error) {
    console.error('❌ updateUserPassword error:', error.message);
    return null;
  }
};

const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Error getting all users:', error.message);
      return [];
    }
    return data;
  } catch (error) {
    console.error('❌ getAllUsers error:', error.message);
    return [];
  }
};

const updateUserBalance = async (userId, newBalance) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('❌ Error updating balance:', error.message);
      return null;
    }
    console.log('✅ Balance updated for user:', userId);
    return data;
  } catch (error) {
    console.error('❌ updateUserBalance error:', error.message);
    return null;
  }
};

// ============================================
// ✅ INITIALIZATION
// ============================================
console.log('🚀 Initializing Supabase client...');

testConnection().then(connected => {
  if (connected) {
    getTableNames();
    checkAuth();
  }
});

// ============================================
// ✅ EXPORT
// ============================================
module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  getTableNames,
  checkAuth,
  getUserById,
  getUserByEmail,
  getUserByMobile,
  getUserByLogin,
  createUser,
  updateUser,
  updateUserPassword,
  updateUserBalance,
  getAllUsers,
};