const { supabase, supabaseAdmin } = require('../config/supabase');
const UserModel = require('../models/userModel');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get all bets
const getAllBets = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get all bets error:', error);
    res.status(500).json({ error: 'Failed to get bets' });
  }
};

// Get deposit requests
const getDepositRequests = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('deposit_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get deposit requests error:', error);
    res.status(500).json({ error: 'Failed to get deposit requests' });
  }
};

// Approve deposit request
const approveDeposit = async (req, res) => {
  try {
    const { requestId, uniqueId, amount } = req.body;
    
    console.log(`✅ Approving deposit: ₹${amount} for user ${uniqueId}`);
    
    // Update request status
    await supabase
      .from('deposit_requests')
      .update({ status: 'approved', approved_at: new Date() })
      .eq('id', requestId);
    
    // Update user balance (ADD amount)
    const user = await UserModel.findByUniqueId(uniqueId);
    if (user) {
      const newBalance = user.balance + amount;
      await UserModel.updateBalance(uniqueId, newBalance);
      console.log(`✅ Added ₹${amount}, new balance: ${newBalance}`);
      
      // Add transaction
      await supabase.from('transactions').insert([{
        unique_id: uniqueId,
        type: 'deposit',
        amount: amount,
        status: 'success',
        created_at: new Date()
      }]);
    }
    
    res.json({ success: true, message: 'Deposit approved' });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
};

// Reject deposit request
const rejectDeposit = async (req, res) => {
  try {
    const { requestId } = req.body;
    
    console.log(`❌ Rejecting deposit request`);
    
    await supabase
      .from('deposit_requests')
      .update({ status: 'rejected', rejected_at: new Date() })
      .eq('id', requestId);
    
    res.json({ success: true, message: 'Deposit rejected' });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
};

// Get withdraw requests
const getWithdrawRequests = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('withdraw_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Get withdraw requests error:', error);
    res.status(500).json({ error: 'Failed to get withdraw requests' });
  }
};

// ✅ Approve withdraw request - DEDUCT HERE
const approveWithdraw = async (req, res) => {
  try {
    const { requestId, uniqueId, amount } = req.body;
    
    console.log(`✅ Approving withdraw: ₹${amount} for user ${uniqueId}`);
    
    // Update request status
    await supabase
      .from('withdraw_requests')
      .update({ status: 'approved', approved_at: new Date() })
      .eq('id', requestId);
    
    // ✅ DEDUCT amount from user balance on approval
    const user = await UserModel.findByUniqueId(uniqueId);
    if (user) {
      const newBalance = user.balance - amount;
      await UserModel.updateBalance(uniqueId, newBalance);
      console.log(`✅ Deducted ₹${amount}, new balance: ${newBalance}`);
      
      // Add transaction record
      await supabase.from('transactions').insert([{
        unique_id: uniqueId,
        type: 'withdraw',
        amount: amount,
        status: 'success',
        created_at: new Date()
      }]);
    }
    
    res.json({ success: true, message: 'Withdraw approved and amount deducted' });
  } catch (error) {
    console.error('Approve withdraw error:', error);
    res.status(500).json({ error: 'Failed to approve withdraw' });
  }
};

// ✅ Reject withdraw request - REFUND USER (add back amount)
const rejectWithdraw = async (req, res) => {
  try {
    const { requestId, uniqueId, amount } = req.body;
    
    console.log(`❌ Rejecting withdraw request for user ${uniqueId}, refunding ₹${amount}`);
    
    await supabase
      .from('withdraw_requests')
      .update({ status: 'rejected', rejected_at: new Date() })
      .eq('id', requestId);
    
    // ✅ REFUND user - add back the amount
    const user = await UserModel.findByUniqueId(uniqueId);
    if (user) {
      const newBalance = user.balance + amount;
      await UserModel.updateBalance(uniqueId, newBalance);
      console.log(`✅ Refunded ₹${amount}, new balance: ${newBalance}`);
    }
    
    res.json({ success: true, message: 'Withdraw rejected and amount refunded' });
  } catch (error) {
    console.error('Reject withdraw error:', error);
    res.status(500).json({ error: 'Failed to reject withdraw' });
  }
};

// Get platform stats
const getPlatformStats = async (req, res) => {
  try {
    // Get total users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get total bets
    const { count: totalBets, error: betsError } = await supabase
      .from('bets')
      .select('*', { count: 'exact', head: true });
    
    // Get total deposit amount
    const { data: deposits, error: depositError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'deposit');
    
    const totalDeposits = deposits?.reduce((sum, t) => sum + t.amount, 0) || 0;
    
    // Get total withdraw amount
    const { data: withdraws, error: withdrawError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'withdraw');
    
    const totalWithdraws = withdraws?.reduce((sum, t) => sum + t.amount, 0) || 0;
    
    res.json({
      totalUsers: totalUsers || 0,
      totalBets: totalBets || 0,
      totalDeposits,
      totalWithdraws,
      platformProfit: totalDeposits - totalWithdraws
    });
    
  } catch (error) {
    console.error('Get platform stats error:', error);
    res.status(500).json({ error: 'Failed to get platform stats' });
  }
};

module.exports = {
  getAllUsers,
  getAllBets,
  getDepositRequests,
  approveDeposit,
  rejectDeposit,
  getWithdrawRequests,
  approveWithdraw,
  rejectWithdraw,
  getPlatformStats
};