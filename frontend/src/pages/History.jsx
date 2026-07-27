import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function History() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [filter, setFilter] = useState('all'); // all, win, loss
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWins: 0,
    totalLosses: 0,
    totalProfit: 0,
    totalLoss: 0,
    winRate: 0
  });

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(currentUser);
    setUser(userData);
    loadTransactionHistory(userData.uniqueId);
  }, [navigate]);

  const loadTransactionHistory = (uniqueId) => {
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    // Filter user transactions
    const userTransactions = allTransactions.filter(t => t.uniqueId === uniqueId);
    
    // Calculate date 90 days ago
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Filter last 90 days
    const recentTransactions = userTransactions.filter(t => {
      const transactionDate = new Date(t.timestamp || t.date);
      return transactionDate >= ninetyDaysAgo;
    });
    
    // Sort by date (newest first)
    recentTransactions.sort((a, b) => b.timestamp - a.timestamp);
    
    setTransactions(recentTransactions);
    setFilteredTransactions(recentTransactions);
    calculateStats(recentTransactions);
  };

  const calculateStats = (txns) => {
    const wins = txns.filter(t => t.type === 'win');
    const losses = txns.filter(t => t.type === 'loss');
    const totalWinsAmount = wins.reduce((sum, t) => sum + (t.profit || t.amount), 0);
    const totalLossAmount = losses.reduce((sum, t) => sum + t.amount, 0);
    
    setStats({
      totalBets: txns.length,
      totalWins: wins.length,
      totalLosses: losses.length,
      totalProfit: totalWinsAmount,
      totalLoss: totalLossAmount,
      netProfit: totalWinsAmount - totalLossAmount,
      winRate: txns.length > 0 ? ((wins.length / txns.length) * 100).toFixed(1) : 0
    });
  };

  const applyFilter = (filterType) => {
    setFilter(filterType);
    if (filterType === 'all') {
      setFilteredTransactions(transactions);
    } else if (filterType === 'win') {
      setFilteredTransactions(transactions.filter(t => t.type === 'win'));
    } else if (filterType === 'loss') {
      setFilteredTransactions(transactions.filter(t => t.type === 'loss'));
    }
  };

  // Clear all history
  const clearHistory = () => {
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    
    // Remove only current user's transactions
    const remainingTransactions = allTransactions.filter(t => t.uniqueId !== user?.uniqueId);
    
    localStorage.setItem('transactions', JSON.stringify(remainingTransactions));
    
    // Reload history
    loadTransactionHistory(user?.uniqueId);
    setShowConfirm(false);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header with Clear Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">📜 Bet History</h1>
            <p className="text-gray-400 mt-1">Last 90 days transactions</p>
          </div>
          
          {/* Clear History Button */}
          {transactions.length > 0 && (
            <button
              onClick={() => setShowConfirm(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2"
            >
              🗑️ Clear History
            </button>
          )}
        </div>

        {/* Confirmation Modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold text-white mb-3">Clear History?</h2>
              <p className="text-gray-400 mb-6">
                Are you sure? This will delete all your bet history from last 90 days. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={clearHistory}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm">Total Bets</p>
            <p className="text-2xl font-bold text-white">{stats.totalBets}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm">Win Rate</p>
            <p className="text-2xl font-bold text-green-400">{stats.winRate}%</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm">Total Profit</p>
            <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ₹{stats.netProfit || 0}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-gray-400 text-sm">W/L</p>
            <p className="text-2xl font-bold text-white">
              {stats.totalWins}/{stats.totalLosses}
            </p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => applyFilter('all')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => applyFilter('win')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'win'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🟢 Wins
          </button>
          <button
            onClick={() => applyFilter('loss')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              filter === 'loss'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🔴 Losses
          </button>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-lg">No transactions in last 90 days</p>
            <p className="text-gray-500 text-sm mt-2">Start trading to see your history</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-gray-400 font-semibold">Date</th>
                    <th className="px-6 py-4 text-left text-gray-400 font-semibold">Prediction</th>
                    <th className="px-6 py-4 text-left text-gray-400 font-semibold">Bet Amount</th>
                    <th className="px-6 py-4 text-left text-gray-400 font-semibold">Result</th>
                    <th className="px-6 py-4 text-left text-gray-400 font-semibold">Profit/Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-750 transition">
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          tx.prediction === 'green'
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {tx.prediction === 'green' ? '🟢 GREEN' : '🔴 RED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        ₹{tx.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          tx.type === 'win'
                            ? 'bg-green-600/20 text-green-400'
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {tx.type === 'win' ? '✅ WIN' : '❌ LOSS'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${
                          tx.type === 'win' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {tx.type === 'win' ? `+₹${tx.profit || tx.amount}` : `-₹${tx.amount}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer Stats with Clear Button */}
            <div className="border-t border-gray-700 px-6 py-4 bg-gray-900 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Last 90 days • {new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString()} to {new Date().toLocaleDateString()}
                </p>
              </div>
              
              {transactions.length > 0 && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="text-red-400 hover:text-red-300 text-sm font-semibold transition"
                >
                  🗑️ Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}