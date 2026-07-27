import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

export default function Withdraw() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser')))

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount)
    
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setMessage('❌ Enter valid amount')
      return
    }
    
    if (withdrawAmount < 500) {
      setMessage('❌ Minimum withdraw ₹500')
      return
    }
    
    if (withdrawAmount > user.balance) {
      setMessage('❌ Insufficient balance')
      return
    }
    
    setIsLoading(true)
    
    // ✅ DEDUCT AMOUNT IMMEDIATELY
    const newBalance = user.balance - withdrawAmount
    const updatedUser = { ...user, balance: newBalance }
    
    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(updatedUser))
    
    // Update users array
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    const updatedUsers = users.map(u => 
      u.uniqueId === user.uniqueId ? updatedUser : u
    )
    localStorage.setItem('users', JSON.stringify(updatedUsers))
    
    // Update state
    setUser(updatedUser)
    
    try {
      // Send withdraw request to backend API
      const response = await API.post('/game/withdraw/request', {
        amount: withdrawAmount,
        uniqueId: user.uniqueId,
        name: user.name,
        mobile: user.mobile
      })
      
      if (response.data.success) {
        setMessage(`✅ ₹${withdrawAmount} deducted from your balance! Withdrawal request sent to admin for verification.`)
        setAmount('')
        
        setTimeout(() => {
          navigate('/account')
        }, 2000)
      } else {
        // Refund if API fails
        const refundUser = { ...user, balance: user.balance }
        localStorage.setItem('currentUser', JSON.stringify(refundUser))
        
        const refundUsers = JSON.parse(localStorage.getItem('users') || '[]')
        const refundUpdated = refundUsers.map(u => 
          u.uniqueId === user.uniqueId ? refundUser : u
        )
        localStorage.setItem('users', JSON.stringify(refundUpdated))
        setUser(refundUser)
        
        setMessage('❌ Failed to submit withdraw request')
      }
    } catch (error) {
      console.error('Withdraw error:', error)
      // Refund on error
      const refundUser = { ...user, balance: user.balance }
      localStorage.setItem('currentUser', JSON.stringify(refundUser))
      
      const refundUsers = JSON.parse(localStorage.getItem('users') || '[]')
      const refundUpdated = refundUsers.map(u => 
        u.uniqueId === user.uniqueId ? refundUser : u
      )
      localStorage.setItem('users', JSON.stringify(refundUpdated))
      setUser(refundUser)
      
      setMessage('❌ ' + (error.response?.data?.error || 'Failed to submit withdraw request'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">💸 Withdraw Money</h1>
          <p className="text-gray-400 text-sm mt-1">Withdraw funds from your wallet</p>
        </div>

        <div className="bg-gray-700 rounded-lg p-3 mb-6">
          <p className="text-gray-400 text-xs">User Details</p>
          <p className="text-white font-semibold">{user?.name}</p>
          <p className="text-gray-300 text-sm">📱 {user?.mobile}</p>
          <p className="text-gray-300 text-sm">🆔 {user?.uniqueId}</p>
          <p className="text-green-400 font-bold mt-1">Current Balance: ₹{user?.balance}</p>
        </div>

        <div className="mb-6">
          <label className="text-gray-400 block mb-2">Enter Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (Min ₹500)"
            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4 p-3 bg-yellow-600/20 rounded-lg">
          <p className="text-yellow-400 text-sm">⚠️ Withdrawal Rules</p>
          <p className="text-gray-400 text-xs mt-1">• Minimum withdraw: ₹500</p>
          <p className="text-gray-400 text-xs">• 2% commission will be deducted</p>
          <p className="text-gray-400 text-xs">• Amount will be deducted immediately</p>
          <p className="text-gray-400 text-xs">• Admin verification required</p>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center text-sm ${
            message.includes('✅') ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {message}
          </div>
        )}

        {isLoading && (
          <div className="mb-4 p-3 rounded-lg text-center bg-yellow-600">
            ⏳ Processing...
          </div>
        )}

        <button
          onClick={handleWithdraw}
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            isLoading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {isLoading ? 'Processing...' : '💸 Request Withdrawal'}
        </button>

        <button
          onClick={() => navigate('/account')}
          className="w-full mt-3 text-gray-400 hover:text-white transition text-sm"
        >
          ← Back to Account
        </button>
      </div>
    </div>
  )
}