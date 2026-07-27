const { supabase, supabaseAdmin } = require('../config/supabase');
const { getGlobalGameState, placeUserBet } = require('../services/gameService');
const UserModel = require('../models/userModel');

// Get current game state
const getGameState = async (req, res) => {
  try {
    const gameState = getGlobalGameState();
    res.json(gameState);
  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({ error: 'Failed to get game state' });
  }
};

// Place bet
const placeBet = async (req, res) => {
  try {
    const { amount, prediction } = req.body;
    const userId = req.user.uniqueId;
    
    // Get user
    const user = await UserModel.findByUniqueId(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate bet amount
    if (amount < 10) {
      return res.status(400).json({ error: 'Minimum bet is ₹10' });
    }
    
    if (amount > user.balance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    // Check if user already bet for this candle
    const gameState = getGlobalGameState();
    const existingBet = gameState.bets.find(b => b.userId === userId);
    if (existingBet) {
      return res.status(400).json({ error: 'Already placed bet for this candle' });
    }
    
    // Deduct amount from user balance
    const newBalance = user.balance - amount;
    await UserModel.updateBalance(userId, newBalance);
    
    // Place bet in game state
    const bet = placeUserBet(userId, user.name, amount, prediction);
    
    // Save bet to database
    await supabase.from('bets').insert([{
      unique_id: userId,
      amount: amount,
      prediction: prediction,
      status: 'pending',
      created_at: new Date()
    }]);
    
    res.json({
      success: true,
      message: 'Bet placed successfully',
      bet,
      newBalance
    });
    
  } catch (error) {
    console.error('Place bet error:', error);
    res.status(500).json({ error: 'Failed to place bet' });
  }
};

// ✅ CREATE DEPOSIT REQUEST (User se screenshot lekar)
const createDepositRequest = async (req, res) => {
  try {
    const { amount, proof, proofType } = req.body;
    const userId = req.user.uniqueId;
    const userName = req.user.name;
    const userMobile = req.user.mobile;
    
    const { data, error } = await supabaseAdmin
      .from('deposit_requests')
      .insert({
        unique_id: userId,
        name: userName,
        mobile: userMobile,
        amount: amount,
        proof: proof,
        proof_type: proofType,
        status: 'pending',
        created_at: new Date()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'Deposit request submitted successfully. Awaiting admin approval.',
      request: data 
    });
  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({ error: 'Failed to submit deposit request' });
  }
};

// ✅ CREATE WITHDRAW REQUEST
const createWithdrawRequest = async (req, res) => {
  try {
    const { amount, name, mobile } = req.body;
    const userId = req.user.uniqueId;
    
    const { data, error } = await supabaseAdmin
      .from('withdraw_requests')
      .insert({
        unique_id: userId,
        name: name,
        mobile: mobile,
        amount: amount,
        status: 'pending',
        created_at: new Date()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'Withdraw request submitted successfully. Awaiting admin approval.',
      request: data 
    });
  } catch (error) {
    console.error('Withdraw request error:', error);
    res.status(500).json({ error: 'Failed to submit withdraw request' });
  }
};

// Get user bet history
const getBetHistory = async (req, res) => {
  try {
    const userId = req.user.uniqueId;
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data, error } = await supabase
      .from('bets')
      .select('*')
      .eq('unique_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
    
  } catch (error) {
    console.error('Get bet history error:', error);
    res.status(500).json({ error: 'Failed to get bet history' });
  }
};

// Get user transactions
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.uniqueId;
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('unique_id', userId)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    res.json(data);
    
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name, unique_id, balance')
      .eq('is_admin', false)
      .order('balance', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    res.json(data);
    
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

// Generate referral coupon
const generateCoupon = async (req, res) => {
  try {
    const userId = req.user.uniqueId;
    const userName = req.user.name;
    
    const couponCode = `${userId}_${Date.now().toString(36).toUpperCase()}`;
    
    const { data, error } = await supabase
      .from('referral_coupons')
      .insert([{
        code: couponCode,
        generated_by: userId,
        generated_by_name: userName,
        used: false,
        created_at: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      coupon: data
    });
    
  } catch (error) {
    console.error('Generate coupon error:', error);
    res.status(500).json({ error: 'Failed to generate coupon' });
  }
};

// Get user stats
const getUserStats = async (req, res) => {
  try {
    const userId = req.user.uniqueId;
    
    // Get total bets
    const { data: bets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('unique_id', userId);
    
    if (betsError) throw betsError;
    
    const totalBets = bets.length;
    const totalWins = bets.filter(b => b.status === 'win').length;
    const totalLosses = bets.filter(b => b.status === 'loss').length;
    const winRate = totalBets > 0 ? ((totalWins / totalBets) * 100).toFixed(1) : 0;
    
    // Get referral stats
    const { data: coupons, error: couponsError } = await supabase
      .from('referral_coupons')
      .select('*')
      .eq('generated_by', userId);
    
    if (couponsError) throw couponsError;
    
    const usedCoupons = coupons.filter(c => c.used === true);
    const referralEarned = usedCoupons.length * 20;
    
    res.json({
      totalBets,
      totalWins,
      totalLosses,
      winRate,
      referralStats: {
        totalReferrals: usedCoupons.length,
        totalEarned: referralEarned,
        couponsGenerated: coupons.length,
        activeCoupons: coupons.filter(c => !c.used).length
      }
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
};

module.exports = {
  getGameState,
  placeBet,
  createDepositRequest,
  createWithdrawRequest,  // ✅ ADDED
  getBetHistory,
  getTransactions,
  getLeaderboard,
  generateCoupon,
  getUserStats
};