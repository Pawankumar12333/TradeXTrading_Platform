const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if credentials exist
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials missing! Please check .env file');
  console.error('   SUPABASE_URL and SUPABASE_ANON_KEY are required');
}

// Regular client for frontend
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend operations (with service role key)
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase; // Fallback to anon key if service key not provided

// Test connection function
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

// Run test on import
testConnection();

module.exports = { supabase, supabaseAdmin, testConnection };