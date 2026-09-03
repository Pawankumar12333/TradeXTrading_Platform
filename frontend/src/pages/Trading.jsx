import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGameState, placeBet } from '../services/api';

const CANDLE_DURATION_SECONDS = 12 * 60 * 60;

function getSecondsUntilNextBoundary() {
  const now = new Date();
  const next = new Date(now);
  if (now.getHours() < 12) {
    next.setHours(12, 0, 0, 0);
  } else {
    next.setDate(now.getDate() + 1);
    next.setHours(0, 0, 0, 0);
  }
  return Math.max(1, Math.floor((next - now) / 1000));
}

export default function Trading() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [user, setUser] = useState(null);
  const [candles, setCandles] = useState([]);
  const [timer, setTimer] = useState(CANDLE_DURATION_SECONDS);
  const [betAmount, setBetAmount] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [hasBet, setHasBet] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPrice, setCurrentPrice] = useState(100);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [savedBetAmount, setSavedBetAmount] = useState(0);
  const [savedPrediction, setSavedPrediction] = useState(null);
  
  const isMounted = useRef(true);
  const timerIntervalRef = useRef(null);
  const isGeneratingCandle = useRef(false);

  const getInitialCandles = useCallback(() => {
    return [
      { id: 1, open: 100, high: 105, low: 98, close: 103, color: 'green', price: 103 },
      { id: 2, open: 103, high: 108, low: 101, close: 106, color: 'green', price: 106 },
      { id: 3, open: 106, high: 109, low: 102, close: 104, color: 'red', price: 104 },
      { id: 4, open: 104, high: 107, low: 100, close: 105, color: 'green', price: 105 },
      { id: 5, open: 105, high: 110, low: 103, close: 108, color: 'green', price: 108 },
      { id: 6, open: 108, high: 112, low: 106, close: 109, color: 'green', price: 109 },
      { id: 7, open: 109, high: 113, low: 107, close: 110, color: 'green', price: 110 }
    ];
  }, []);

  const generateNewCandle = useCallback((prevClose) => {
    const isGreen = Math.random() > 0.5;
    const change = (Math.random() * 10 + 2).toFixed(2);
    const open = prevClose;
    const close = isGreen ? open + parseFloat(change) : open - parseFloat(change);
    const high = Math.max(open, close) + (Math.random() * 5);
    const low = Math.min(open, close) - (Math.random() * 5);
    return {
      id: Date.now(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      color: isGreen ? 'green' : 'red',
      price: parseFloat(close.toFixed(2)),
      timestamp: Date.now()
    };
  }, []);

  const addCandleAndRemoveOldest = useCallback((newCandle) => {
    setCandles(prev => {
      const updated = [...prev, newCandle];
      return updated.length > 7 ? updated.slice(1) : updated;
    });
    setCurrentPrice(newCandle.close);
  }, []);

  const checkBetResult = useCallback((newCandle) => {
    if (hasBet && savedPrediction && savedBetAmount > 0) {
      const isWin = savedPrediction === newCandle.color;
      setBalance(prevBalance => {
        let newBalance;
        if (isWin) {
          newBalance = prevBalance + savedBetAmount * 2;
          setMessage(`🎉 YOU WON! +₹${savedBetAmount} profit | New Balance: ₹${newBalance}`);
        } else {
          newBalance = prevBalance;
          setMessage(`😢 YOU LOST! -₹${savedBetAmount} | New Balance: ₹${newBalance}`);
        }
        if (user) {
          const updatedUser = { ...user, balance: newBalance };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        return newBalance;
      });
      setTimeout(() => setMessage(''), 4000);
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      transactions.push({
        id: Date.now(),
        uniqueId: user?.uniqueId,
        type: isWin ? 'win' : 'loss',
        amount: savedBetAmount,
        profit: isWin ? savedBetAmount : 0,
        prediction: savedPrediction,
        actualCandle: newCandle.color,
        date: new Date().toLocaleString(),
        timestamp: Date.now()
      });
      localStorage.setItem('transactions', JSON.stringify(transactions));
      setHasBet(false);
      setPrediction(null);
      setBetAmount('');
      setSavedBetAmount(0);
      setSavedPrediction(null);
    }
  }, [hasBet, savedPrediction, savedBetAmount, user]);

  useEffect(() => {
    if (!isInitialized) return;
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (isMounted.current && !isGeneratingCandle.current) {
        isGeneratingCandle.current = true;
        setTimer(prev => {
          const newTimer = prev - 1;
          if (newTimer <= 0) {
            const lastCandle = candles[candles.length - 1];
            const prevClose = lastCandle ? lastCandle.close : currentPrice;
            const newCandle = generateNewCandle(prevClose);
            setMessage(`🕯️ NEW ${newCandle.color.toUpperCase()} CANDLE! Price: ₹${newCandle.close}`);
            setTimeout(() => setMessage(''), 3000);
            checkBetResult(newCandle);
            addCandleAndRemoveOldest(newCandle);
            isGeneratingCandle.current = false;
            return getSecondsUntilNextBoundary();
          }
          isGeneratingCandle.current = false;
          return newTimer;
        });
      }
    }, 1000);
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isInitialized, candles, currentPrice, generateNewCandle, addCandleAndRemoveOldest, checkBetResult]);

  const formatTime = (seconds) => {
    const total = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let mounted = true;
    isMounted.current = true;
    const initialize = async () => {
      try {
        const token = localStorage.getItem('token');
        const currentUser = localStorage.getItem('currentUser');
        if (!token || !currentUser) {
          if (mounted) navigate('/login');
          return;
        }
        const userData = JSON.parse(currentUser);
        if (mounted) {
          setUser(userData);
          setBalance(userData.balance || 0);
        }
        const initialCandles = getInitialCandles();
        setCandles(initialCandles);
        setCurrentPrice(initialCandles[initialCandles.length - 1].close);
        setTimer(getSecondsUntilNextBoundary());
        try {
          const response = await getGameState();
          if (response?.data && mounted) {
            if (response.data.candleHistory?.length > 0) {
              setCandles(response.data.candleHistory);
            }
          }
        } catch (error) {
          console.log('Server not available, using local mode');
        }
        if (mounted) setIsInitialized(true);
      } catch (error) {
        console.error('Init error:', error);
        if (mounted) navigate('/login');
      }
    };
    initialize();
    return () => {
      mounted = false;
      isMounted.current = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [navigate, getInitialCandles]);

  const placeBetAPI = async () => {
    if (!prediction) {
      setMessage('❌ Select GREEN or RED first!');
      setTimeout(() => setMessage(''), 2000);
      return;
    }
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('❌ Enter valid amount!');
      return;
    }
    if (amount < 10) {
      setMessage('❌ Minimum bet ₹10!');
      return;
    }
    if (amount > balance) {
      setMessage('❌ Insufficient balance!');
      return;
    }
    if (hasBet) {
      setMessage('❌ Already placed bet!');
      return;
    }
    setLoading(true);
    setBalance(prevBalance => {
      const newBalance = prevBalance - amount;
      if (user) {
        const updatedUser = { ...user, balance: newBalance };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
      return newBalance;
    });
    setSavedBetAmount(amount);
    setSavedPrediction(prediction);
    setHasBet(true);
    setMessage(`✅ Bet placed: ₹${amount} on ${prediction.toUpperCase()}. Result in ${formatTime(timer)}`);
    try {
      await placeBet({ amount, prediction });
    } catch (error) {
      console.log('Server bet failed');
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const drawCandle = (candle, index, x, y, candleWidth, chartHeight) => {
    const isGreen = candle.color === 'green';
    const allHighs = candles.map(c => c.high);
    const allLows = candles.map(c => c.low);
    const highest = Math.max(...allHighs, currentPrice, 100);
    const lowest = Math.min(...allLows, currentPrice, 90);
    const range = highest - lowest;
    if (range === 0) return null;
    const bodyTop = isGreen 
      ? y + chartHeight - ((candle.close - lowest) / range) * chartHeight
      : y + chartHeight - ((candle.open - lowest) / range) * chartHeight;
    const bodyBottom = isGreen
      ? y + chartHeight - ((candle.open - lowest) / range) * chartHeight
      : y + chartHeight - ((candle.close - lowest) / range) * chartHeight;
    const bodyHeight = Math.abs(bodyBottom - bodyTop);
    const wickTop = y + chartHeight - ((candle.high - lowest) / range) * chartHeight;
    const wickBottom = y + chartHeight - ((candle.low - lowest) / range) * chartHeight;
    return (
      <g key={candle.id}>
        <line x1={x + candleWidth / 2} y1={wickTop} x2={x + candleWidth / 2} y2={wickBottom} stroke={isGreen ? '#22c55e' : '#ef4444'} strokeWidth="2" />
        <rect x={x + 2} y={bodyTop} width={candleWidth - 4} height={Math.max(1, bodyHeight)} fill={isGreen ? '#22c55e' : '#ef4444'} rx={3} />
        <text x={x + candleWidth / 2} y={wickTop - 5} fontSize="9" fill="#9ca3af" textAnchor="middle">{candle.close}</text>
      </g>
    );
  };

  if (!user || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const chartWidth = 800;
  const chartHeight = 350;
  const candleWidth = (chartWidth - 60) / 8;
  const startX = 30;
  const highest = Math.max(...candles.map(c => c.high), currentPrice, 100);
  const lowest = Math.min(...candles.map(c => c.low), currentPrice, 90);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">📈 Candlestick Trading</h1>
            <p className="text-gray-400 text-sm">Welcome, {user.name}</p>
          </div>
          <div className="bg-gray-800 rounded-xl px-6 py-3 text-center">
            <p className="text-gray-400 text-xs">Your Balance</p>
            <p className="text-3xl font-bold text-green-400">₹{balance}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 mb-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-400 text-sm">📊 Candlestick Chart</p>
            <div className="flex gap-3">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded"></div><span className="text-gray-400 text-xs">GREEN</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div><span className="text-gray-400 text-xs">RED</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div><span className="text-gray-400 text-xs">Next Candle</span></div>
            </div>
          </div>
          
          <svg width="100%" height={chartHeight + 60} viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`} className="w-full">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const price = lowest + (highest - lowest) * (1 - ratio);
              const y = 20 + chartHeight * ratio;
              return (
                <g key={i}>
                  <line x1={10} y1={y} x2={chartWidth - 10} y2={y} stroke="#374151" strokeWidth="1" strokeDasharray="4" />
                  <text x={5} y={y + 3} fontSize="9" fill="#6b7280">{Math.round(price)}</text>
                </g>
              );
            })}
            {candles.map((candle, index) => {
              const x = startX + (index * candleWidth);
              return drawCandle(candle, index, x, 20, candleWidth, chartHeight);
            })}
            <g>
              <rect x={startX + (candles.length * candleWidth)} y={5} width={candleWidth} height={22} fill="#1e3a5f" rx={4} />
              <text x={startX + (candles.length * candleWidth) + candleWidth / 2} y={20} fontSize="11" fill="#60a5fa" textAnchor="middle" fontWeight="bold">{formatTime(timer)}</text>
              <rect x={startX + (candles.length * candleWidth) + 3} y={22} width={candleWidth - 6} height={chartHeight - 4} fill="#3b82f6" opacity="0.3" rx={4} stroke="#60a5fa" strokeWidth="1.5" strokeDasharray="6" />
              <text x={startX + (candles.length * candleWidth) + candleWidth / 2} y={22 + chartHeight / 2 + 5} fontSize="22" fill="#60a5fa" textAnchor="middle" opacity="0.6">?</text>
              <text x={startX + (candles.length * candleWidth) + candleWidth / 2} y={22 + chartHeight + 18} fontSize="10" fill="#60a5fa" textAnchor="middle">Next Candle</text>
            </g>
          </svg>
          
          <div className="text-center mt-6 pt-2 border-t border-gray-700">
            <p className="text-gray-400 text-sm">Current Price</p>
            <p className="text-3xl font-bold text-white">₹{currentPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">⏱️ Next candle in: {formatTime(timer)}</p>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6">
          <p className="text-white font-bold text-lg mb-4">Place Your Bet</p>
          <div className="flex gap-4 mb-6">
            <button onClick={() => setPrediction('green')} disabled={hasBet || loading} className={`flex-1 py-4 rounded-xl font-bold transition ${prediction === 'green' ? 'bg-green-600 ring-4 ring-green-400' : 'bg-gray-700 hover:bg-green-800'} ${(hasBet || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>🟢 PREDICT GREEN</button>
            <button onClick={() => setPrediction('red')} disabled={hasBet || loading} className={`flex-1 py-4 rounded-xl font-bold transition ${prediction === 'red' ? 'bg-red-600 ring-4 ring-red-400' : 'bg-gray-700 hover:bg-red-800'} ${(hasBet || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}>🔴 PREDICT RED</button>
          </div>
          <div className="flex flex-wrap gap-3 mb-6">
            {[10, 50, 100, 500, 1000].map(amt => (
              <button key={amt} onClick={() => setBetAmount(amt.toString())} disabled={hasBet || loading} className={`px-5 py-2 rounded-lg font-semibold ${parseFloat(betAmount) === amt ? 'bg-blue-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'} ${(hasBet || loading) ? 'opacity-50' : ''}`}>₹{amt}</button>
            ))}
            <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} disabled={hasBet || loading} placeholder="Custom" className="bg-gray-700 text-white px-4 py-2 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {message && (
            <div className={`mb-6 p-4 rounded-xl text-center font-semibold ${message.includes('WON') ? 'bg-green-600/20 text-green-400' : message.includes('LOST') ? 'bg-red-600/20 text-red-400' : message.includes('CANDLE') ? 'bg-purple-600/20 text-purple-400' : 'bg-blue-600/20 text-blue-400'}`}>{message}</div>
          )}
          <button onClick={placeBetAPI} disabled={hasBet || loading} className={`w-full py-4 rounded-xl font-bold text-xl transition ${(hasBet || loading) ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}>
            {loading ? 'Processing...' : (hasBet ? '⏳ BET PLACED - WAITING' : '💰 PLACE BET')}
          </button>
          <div className="mt-4 text-center text-gray-500 text-xs">
            <p>💸 Min Bet: ₹10 | 1:1 Profit (Win = Get ₹2 for ₹1 bet)</p>
            <p>🕐 New candle every 12 hours (at 12:00 AM &amp; 12:00 PM)</p>
            <p>✅ WIN: Balance + (Bet × 2) | ❌ LOSS: Balance - Bet</p>
          </div>
        </div>
      </div>
    </div>
  );
}