const { supabase, supabaseAdmin } = require('../config/supabase');

const UserModel = {
  // Create new user
  async create(userData) {
    try {
      console.log('📝 Creating user in DB:', { email: userData.email });
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          unique_id: userData.uniqueId,
          name: userData.name,
          mobile: userData.mobile,
          email: userData.email.toLowerCase().trim(),
          password: userData.password,
          gender: userData.gender,
          balance: userData.balance || 100,
          is_admin: userData.is_admin || false,
          referred_by: userData.referredBy || null,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase insert error:', error.message);
        throw error;
      }
      
      console.log('✅ User created:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Create user error:', error.message);
      throw error;
    }
  },

  // Find user by email
  async findByEmail(email) {
    try {
      if (!email) return null;
      console.log('🔍 Finding user by email:', email);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('findByEmail error:', error.message);
      return null;
    }
  },

  // Find user by mobile
  async findByMobile(mobile) {
    try {
      if (!mobile) return null;
      console.log('🔍 Finding user by mobile:', mobile);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('mobile', String(mobile))
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('findByMobile error:', error.message);
      return null;
    }
  },

  // Find user by mobile OR email (login)
  async findByLogin(loginValue) {
    try {
      const v = String(loginValue).trim();
      if (!v) return null;
      
      console.log('🔍 Finding user by login:', v);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`mobile.eq.${v},email.eq.${v.toLowerCase()}`)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('findByLogin error:', error.message);
      return null;
    }
  },

  // Find user by ID
  async getById(id) {
    try {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('getById error:', error.message);
      return null;
    }
  },

  // Find user by unique_id
  async findByUniqueId(uniqueId) {
    try {
      if (!uniqueId) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('unique_id', uniqueId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('findByUniqueId error:', error.message);
      return null;
    }
  },

  // Update user balance
  async updateBalance(uniqueId, newBalance) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ balance: newBalance, updated_at: new Date() })
        .eq('unique_id', uniqueId)
        .select()
        .single();
      
      if (error) throw error;
      console.log('✅ Balance updated:', { uniqueId, newBalance });
      return data;
    } catch (error) {
      console.error('updateBalance error:', error.message);
      throw error;
    }
  },

  // Update user password
  async updatePassword(uniqueId, hashedPassword) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({ password: hashedPassword, updated_at: new Date() })
        .eq('unique_id', uniqueId)
        .select()
        .single();
      
      if (error) throw error;
      console.log('✅ Password updated for user:', uniqueId);
      return data;
    } catch (error) {
      console.error('updatePassword error:', error.message);
      throw error;
    }
  },

  // Get all users (admin)
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('getAllUsers error:', error.message);
      return [];
    }
  }
};

// ✅ CORRECT EXPORT - Direct export
module.exports = UserModel;