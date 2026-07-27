// Global game state for all users
let globalGameState = {
  currentCandle: {
    color: 'green',
    price: 100,
    timestamp: Date.now(),
    open: 100,
    high: 105,
    low: 98,
    close: 103
  },
  timer: 180,
  candleHistory: [],
  bets: [],
  lastUpdateTime: Date.now()
};

// Generate random price change
const generatePriceChange = (currentPrice, direction) => {
  const change = (Math.random() * 20 - 10).toFixed(2);
  let newPrice = currentPrice + parseFloat(change);
  if (newPrice < 10) newPrice = 10;
  return parseFloat(newPrice.toFixed(2));
};

// Generate new candle based on BET AMOUNTS (Majority Amount Opposite)
const generateNewCandleByBetAmount = () => {
  // Calculate TOTAL AMOUNT on Green and Red
  let greenTotalAmount = 0;
  let redTotalAmount = 0;
  let greenUserCount = 0;
  let redUserCount = 0;
  
  for (const bet of globalGameState.bets) {
    if (bet.prediction === 'green') {
      greenTotalAmount += bet.amount;
      greenUserCount++;
    } else {
      redTotalAmount += bet.amount;
      redUserCount++;
    }
  }
  
  const totalAmount = greenTotalAmount + redTotalAmount;
  
  console.log('========================================');
  console.log('📊 BET AMOUNT STATISTICS:');
  console.log(`   🟢 GREEN Total Amount: ₹${greenTotalAmount} (${greenUserCount} users)`);
  console.log(`   🔴 RED Total Amount: ₹${redTotalAmount} (${redUserCount} users)`);
  console.log(`   📊 Total Bet Amount: ₹${totalAmount}`);
  console.log('========================================');
  
  let isGreen;
  let decisionReason = '';
  
  // MAJORITY AMOUNT OPPOSITE LOGIC
  if (greenTotalAmount > redTotalAmount) {
    // More AMOUNT on GREEN → Market goes RED
    isGreen = false;
    decisionReason = `Majority AMOUNT on GREEN (₹${greenTotalAmount} > ₹${redTotalAmount}) → Market goes RED 🔴`;
  } else if (redTotalAmount > greenTotalAmount) {
    // More AMOUNT on RED → Market goes GREEN
    isGreen = true;
    decisionReason = `Majority AMOUNT on RED (₹${redTotalAmount} > ₹${greenTotalAmount}) → Market goes GREEN 🟢`;
  } else {
    // No bets or equal amounts → Random 50-50
    isGreen = Math.random() > 0.5;
    decisionReason = `No bets or equal amounts (₹${greenTotalAmount} = ₹${redTotalAmount}) → Random: ${isGreen ? 'GREEN 🟢' : 'RED 🔴'}`;
  }
  
  console.log(`📊 DECISION: ${decisionReason}`);
  
  // Generate price change
  const newPrice = generatePriceChange(globalGameState.currentCandle.price, isGreen ? 'up' : 'down');
  
  const newCandle = {
    color: isGreen ? 'green' : 'red',
    price: newPrice,
    timestamp: Date.now(),
    open: globalGameState.currentCandle.price,
    close: newPrice,
    high: Math.max(globalGameState.currentCandle.price, newPrice) + (Math.random() * 5),
    low: Math.min(globalGameState.currentCandle.price, newPrice) - (Math.random() * 5)
  };
  
  // Update history (keep last 7 candles)
  globalGameState.candleHistory.push(newCandle);
  if (globalGameState.candleHistory.length > 7) {
    globalGameState.candleHistory.shift();
  }
  
  return newCandle;
};

// Settle all bets and distribute
const settleBets = (resultCandle) => {
  const winners = [];
  const losers = [];
  let totalWinAmount = 0;
  let totalLossAmount = 0;
  
  for (const bet of globalGameState.bets) {
    if (bet.prediction === resultCandle.color) {
      bet.status = 'win';
      bet.profit = bet.amount;
      bet.payout = bet.amount * 2;
      winners.push(bet);
      totalWinAmount += bet.payout;
    } else {
      bet.status = 'loss';
      bet.profit = -bet.amount;
      losers.push(bet);
      totalLossAmount += bet.amount;
    }
  }
  
  console.log('========================================');
  console.log('📊 RESULTS:');
  console.log(`   ✅ Winners: ${winners.length} users (Payout: ₹${totalWinAmount})`);
  console.log(`   ❌ Losers: ${losers.length} users (Loss: ₹${totalLossAmount})`);
  console.log(`   🎯 Actual Candle: ${resultCandle.color.toUpperCase()} at ₹${resultCandle.price}`);
  console.log('========================================\n');
  
  return { winners, losers, totalWinAmount, totalLossAmount };
};

// Update game state (called every 3 minutes)
const updateGameState = () => {
  // Generate new candle based on bet amounts
  const newCandle = generateNewCandleByBetAmount();
  
  // Settle bets from previous candle
  const results = settleBets(newCandle);
  
  // Update current candle
  globalGameState.currentCandle = newCandle;
  
  // Reset bets for next round
  globalGameState.bets = [];
  
  // Reset timer
  globalGameState.timer = 180;
  globalGameState.lastUpdateTime = Date.now();
  
  console.log(`🕯️ NEW CANDLE: ${newCandle.color.toUpperCase()} at ₹${newCandle.price}`);
  console.log('========================================\n');
  
  // Return new state
  return {
    currentCandle: globalGameState.currentCandle,
    timer: globalGameState.timer,
    candleHistory: globalGameState.candleHistory,
    results: {
      winners: results.winners,
      losers: results.losers
    }
  };
};

// Get current game state
const getGlobalGameState = () => {
  // Calculate remaining time
  const elapsed = (Date.now() - globalGameState.lastUpdateTime) / 1000;
  const remaining = Math.max(0, globalGameState.timer - elapsed);
  
  // Calculate current round bet amounts for frontend display
  let greenAmount = 0;
  let redAmount = 0;
  let greenUsers = 0;
  let redUsers = 0;
  
  for (const bet of globalGameState.bets) {
    if (bet.prediction === 'green') {
      greenAmount += bet.amount;
      greenUsers++;
    } else {
      redAmount += bet.amount;
      redUsers++;
    }
  }
  
  return {
    currentCandle: globalGameState.currentCandle,
    timer: remaining,
    candleHistory: globalGameState.candleHistory,
    currentBets: {
      greenAmount,
      redAmount,
      greenUsers,
      redUsers,
      totalBets: globalGameState.bets.length
    }
  };
};

// Place user bet
const placeUserBet = (userId, userName, amount, prediction) => {
  const bet = {
    userId,
    userName,
    amount,
    prediction,
    timestamp: Date.now(),
    status: 'pending'
  };
  
  globalGameState.bets.push(bet);
  
  // Calculate current statistics
  let greenTotal = 0;
  let redTotal = 0;
  for (const b of globalGameState.bets) {
    if (b.prediction === 'green') {
      greenTotal += b.amount;
    } else {
      redTotal += b.amount;
    }
  }
  
  console.log(`📊 BET PLACED: ${userName} placed ₹${amount} on ${prediction.toUpperCase()}`);
  console.log(`   Current Round - 🟢 GREEN: ₹${greenTotal}, 🔴 RED: ₹${redTotal}`);
  
  return bet;
};

// Reset game state (for testing)
const resetGameState = () => {
  globalGameState = {
    currentCandle: {
      color: 'green',
      price: 100,
      timestamp: Date.now(),
      open: 100,
      high: 105,
      low: 98,
      close: 103
    },
    timer: 180,
    candleHistory: [],
    bets: [],
    lastUpdateTime: Date.now()
  };
  console.log('🔄 Game state reset');
};

module.exports = {
  getGlobalGameState,
  updateGameState,
  placeUserBet,
  resetGameState
};