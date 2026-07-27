import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Account() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [balance, setBalance] = useState(0)
  const [message, setMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [editData, setEditData] = useState({})
  const [transactions, setTransactions] = useState([])
  const [lifetimeDeposit, setLifetimeDeposit] = useState(0)
  const [lifetimeWithdraw, setLifetimeWithdraw] = useState(0)
  const [copySuccess, setCopySuccess] = useState('')
  
  // Referral States
  const [coupon, setCoupon] = useState('')
  const [couponMessage, setCouponMessage] = useState('')
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarned: 0,
    couponsGenerated: 0,
    activeCoupons: 0
  })

  // Load all transactions
  const loadAllTransactions = useCallback((uniqueId) => {
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]')
    const userTransactions = allTransactions.filter(t => t.uniqueId === uniqueId)
    
    const totalDeposit = userTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0)
    const totalWithdraw = userTransactions.filter(t => t.type === 'withdraw').reduce((sum, t) => sum + t.amount, 0)
    
    setLifetimeDeposit(totalDeposit)
    setLifetimeWithdraw(totalWithdraw)
  }, [])

  // Load recent transactions (last 90 days)
  const loadRecentTransactions = useCallback((uniqueId) => {
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]')
    const userTransactions = allTransactions.filter(t => t.uniqueId === uniqueId)
    
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const recentTransactions = userTransactions.filter(t => {
      const transactionDate = new Date(t.timestamp || t.date)
      return transactionDate >= ninetyDaysAgo
    })
    
    recentTransactions.sort((a, b) => b.timestamp - a.timestamp)
    setTransactions(recentTransactions)
  }, [])

  // Load Referral Stats
  const loadReferralStats = useCallback((userId) => {
    const coupons = JSON.parse(localStorage.getItem('referralCoupons') || '[]')
    const myCoupons = coupons.filter(c => c.generatedBy === userId)
    const usedCoupons = myCoupons.filter(c => c.used === true)
    
    setReferralStats({
      totalReferrals: usedCoupons.length,
      totalEarned: usedCoupons.length * 20,
      couponsGenerated: myCoupons.length,
      activeCoupons: myCoupons.filter(c => !c.used).length
    })
  }, [])

  // Initial load
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'))
    if (!currentUser) {
      navigate('/login')
      return
    }
    setUser(currentUser)
    setBalance(currentUser.balance)
    setEditData({
      name: currentUser.name,
      mobile: currentUser.mobile,
      gender: currentUser.gender,
      password: ''
    })
    
    loadAllTransactions(currentUser.uniqueId)
    loadRecentTransactions(currentUser.uniqueId)
    loadReferralStats(currentUser.uniqueId)
  }, [navigate, loadAllTransactions, loadRecentTransactions, loadReferralStats])

  // Generate Coupon
  const generateCoupon = () => {
    const couponCode = `${user.uniqueId}_${Date.now().toString(36).toUpperCase()}`
    
    const coupons = JSON.parse(localStorage.getItem('referralCoupons') || '[]')
    const newCoupon = {
      code: couponCode,
      generatedBy: user.uniqueId,
      generatedByName: user.name,
      used: false,
      usedBy: null,
      createdAt: Date.now()
    }
    coupons.push(newCoupon)
    localStorage.setItem('referralCoupons', JSON.stringify(coupons))
    
    setCoupon(couponCode)
    setCouponMessage('✅ Coupon generated! Share with friends.')
    
    navigator.clipboard.writeText(couponCode)
    loadReferralStats(user.uniqueId)
    
    setTimeout(() => setCouponMessage(''), 3000)
  }

  // Copy Coupon
  const copyCoupon = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon)
      setCouponMessage('✅ Coupon copied to clipboard!')
      setTimeout(() => setCouponMessage(''), 2000)
    }
  }

  const copyUID = () => {
    if (user?.uniqueId) {
      navigator.clipboard.writeText(user.uniqueId.toString())
      setCopySuccess('✅ Copied!')
      setTimeout(() => setCopySuccess(''), 2000)
    }
  }

  const updateUserData = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const updatedUsers = users.map(u => 
      u.uniqueId === user.uniqueId 
        ? { 
            ...u, 
            name: editData.name,
            mobile: editData.mobile,
            gender: editData.gender,
            password: editData.password || u.password,
            balance: balance 
          }
        : u
    )
    localStorage.setItem('users', JSON.stringify(updatedUsers))
    
    const updatedUser = { 
      ...user, 
      name: editData.name,
      mobile: editData.mobile,
      gender: editData.gender,
      balance: balance 
    }
    localStorage.setItem('currentUser', JSON.stringify(updatedUser))
    setUser(updatedUser)
    setIsEditing(false)
    setMessage('✅ Profile updated successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">My Account</h1>
          <button 
            onClick={() => {
              localStorage.removeItem('currentUser')
              navigate('/login')
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
          >
            Logout 🚪
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN - Profile & Wallet */}
          <div>
            {/* Profile Card */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg mb-6">
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-6xl">
                  {user.gender === 'male' ? '👨' : '👩'}
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                        className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Name"
                      />
                      <input
                        type="tel"
                        value={editData.mobile}
                        onChange={(e) => setEditData({...editData, mobile: e.target.value})}
                        className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Mobile"
                        maxLength="10"
                      />
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={editData.password}
                          onChange={(e) => setEditData({...editData, password: e.target.value})}
                          className="w-full p-2 rounded bg-gray-700 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="New Password (optional)"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? "👁️" : "🔒"}
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditData({...editData, gender: 'male'})}
                          className={`px-3 py-1 rounded transition ${editData.gender === 'male' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          👨 Male
                        </button>
                        <button
                          onClick={() => setEditData({...editData, gender: 'female'})}
                          className={`px-3 py-1 rounded transition ${editData.gender === 'female' ? 'bg-pink-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                          👩 Female
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={updateUserData} className="bg-green-600 hover:bg-green-700 px-4 py-1 rounded transition">Save</button>
                        <button onClick={() => setIsEditing(false)} className="bg-gray-600 hover:bg-gray-700 px-4 py-1 rounded transition">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-white">{user.name}</p>
                      <p className="text-gray-400">📱 {user.mobile}</p>
                      
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-400">🆔 {user.uniqueId}</p>
                        <button
                          onClick={copyUID}
                          className="text-blue-400 hover:text-blue-300 transition text-sm flex items-center gap-1 bg-gray-700 px-2 py-1 rounded"
                          title="Copy UID"
                        >
                          📋 Copy
                        </button>
                        {copySuccess && (
                          <span className="text-green-400 text-xs">{copySuccess}</span>
                        )}
                      </div>
                      
                      <p className="text-gray-400">⚧ {user.gender === 'male' ? 'Male' : 'Female'}</p>
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="text-blue-400 text-sm mt-2 hover:underline"
                      >
                        ✏️ Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Referral Section - Coupon Generate */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-2">🎁 Refer & Earn</p>
                
                {!coupon ? (
                  <button
                    onClick={generateCoupon}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 py-2 rounded-lg font-semibold transition"
                  >
                    🎟️ Generate Coupon
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-gray-700 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">Your Coupon Code</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-yellow-400 font-mono text-sm bg-gray-900 px-3 py-1 rounded">
                          {coupon}
                        </code>
                        <button
                          onClick={copyCoupon}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          📋 Copy
                        </button>
                      </div>
                    </div>
                    <p className="text-green-400 text-xs text-center">
                      Share this coupon with friends. When they register, you get ₹20!
                    </p>
                  </div>
                )}
                
                {couponMessage && (
                  <p className="text-green-400 text-xs text-center mt-2">{couponMessage}</p>
                )}
              </div>

              {/* Referral Stats */}
              <div className="mt-4 bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-white font-semibold text-sm mb-2">📊 Referral Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">Total Referrals</p>
                    <p className="text-white text-lg font-bold">{referralStats.totalReferrals}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">Earned</p>
                    <p className="text-green-400 text-lg font-bold">₹{referralStats.totalEarned}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">Coupons Used</p>
                    <p className="text-white text-lg font-bold">{referralStats.activeCoupons}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-xs">Active</p>
                    <p className="text-yellow-400 text-lg font-bold">{referralStats.couponsGenerated - referralStats.totalReferrals}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet Section */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-white mb-4">💰 Wallet</h2>
              
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 mb-6">
                <p className="text-white text-sm">Current Balance</p>
                <p className="text-4xl font-bold text-white">₹{balance}</p>
              </div>

              <div className="mb-6">
                <p className="text-gray-400 text-sm mb-2">📊 Lifetime Statistics</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-600/20 rounded-lg p-3 text-center">
                    <p className="text-blue-400 text-sm">Total Deposit</p>
                    <p className="text-white text-xl font-bold">₹{lifetimeDeposit}</p>
                  </div>
                  <div className="bg-orange-600/20 rounded-lg p-3 text-center">
                    <p className="text-orange-400 text-sm">Total Withdraw</p>
                    <p className="text-white text-xl font-bold">₹{lifetimeWithdraw}</p>
                  </div>
                </div>
              </div>

              {/* Deposit & Withdraw Buttons - Navigation */}
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/deposit')} 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold transition"
                >
                  💰 Deposit
                </button>
                <button 
                  onClick={() => navigate('/withdraw')} 
                  className="flex-1 bg-orange-600 hover:bg-orange-700 py-3 rounded-lg font-semibold transition"
                >
                  💸 Withdraw
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-400 text-center">
                <p>💰 Min Deposit: ₹100 | 💸 Min Withdraw: ₹500 (2% commission)</p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Transaction History */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">📜 Transaction History</h2>
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                Last 90 days
              </span>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400">No transactions in last 90 days</p>
                <p className="text-gray-500 text-sm mt-2">Make a deposit to get started</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">
                            {tx.type === 'deposit' ? '💰' : tx.type === 'referral_bonus' ? '🎁' : '💸'}
                          </span>
                          <span className="font-semibold text-white">
                            {tx.type === 'deposit' ? 'Deposit' : tx.type === 'referral_bonus' ? 'Referral Bonus' : 'Withdraw'}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            tx.status === 'success' ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            {tx.status}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{tx.date}</p>
                        {tx.note && (
                          <p className="text-gray-500 text-xs mt-1">{tx.note}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          tx.type === 'deposit' ? 'text-green-400' : 
                          tx.type === 'referral_bonus' ? 'text-purple-400' : 'text-orange-400'
                        }`}>
                          {tx.type === 'withdraw' ? '-' : '+'} ₹{tx.amount}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {transactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Transactions (90 days):</span>
                  <span className="text-white font-semibold">{transactions.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Showing from:</span>
                  <span className="text-white text-xs">
                    {new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}