import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

export default function Deposit() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(null)
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('currentUser')))

  const handleAmountChange = (e) => {
    const amt = e.target.value
    setAmount(amt)
    if (amt) {
      setSelectedAmount(amt)
      setShowQR(true)
    } else {
      setShowQR(false)
      setSelectedAmount(null)
    }
  }

  const closeQR = () => {
    setShowQR(false)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setMessage('❌ Only JPG, PNG or PDF files allowed')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage('❌ File size must be less than 5MB')
        return
      }
      setSelectedFile(file)
      setMessage('')
    }
  }

  // ✅ FIXED: Backend API call with correct route
  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount)
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setMessage('❌ Please select an amount')
      return
    }
    
    if (!selectedFile) {
      setMessage('❌ Please upload payment screenshot')
      return
    }
    
    setIsLoading(true)
    
    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        // ✅ FIXED: Correct URL with /game/ prefix
        const response = await API.post('/game/deposit/request', {
          amount: depositAmount,
          proof: reader.result,
          proofType: selectedFile.type
        })
        
        if (response.data.success) {
          setMessage('✅ Deposit request submitted! Waiting for admin approval.')
          setAmount('')
          setSelectedFile(null)
          setShowQR(false)
          
          setTimeout(() => {
            navigate('/account')
          }, 2000)
        } else {
          setMessage('❌ Failed to submit deposit request')
        }
      } catch (error) {
        console.error('Deposit error:', error)
        setMessage('❌ ' + (error.response?.data?.error || 'Failed to submit deposit request'))
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsDataURL(selectedFile)
  }

  const depositAmounts = [50, 100, 300, 500, 700, 1000]

  // Get QR code image path
  const getQRImage = (amount) => {
    try {
      return new URL(`../photo/${amount}.jpg`, import.meta.url).href
    } catch (error) {
      return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white">💰 Deposit Money</h1>
          <p className="text-gray-400 text-sm mt-1">Add funds to your wallet</p>
        </div>

        <div className="bg-gray-700 rounded-lg p-3 mb-6">
          <p className="text-gray-400 text-xs">User Details</p>
          <p className="text-white font-semibold">{user?.name}</p>
          <p className="text-gray-300 text-sm">📱 {user?.mobile}</p>
          <p className="text-gray-300 text-sm">🆔 {user?.uniqueId}</p>
        </div>

        <div className="mb-6">
          <label className="text-gray-400 block mb-2">Select Amount (₹)</label>
          <select
            value={amount}
            onChange={handleAmountChange}
            className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Amount --</option>
            {depositAmounts.map((amt) => (
              <option key={amt} value={amt}>₹{amt}</option>
            ))}
          </select>
        </div>

        {/* QR Code Modal */}
        {showQR && selectedAmount && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Scan QR Code</h2>
                <button
                  onClick={closeQR}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-300 mb-4">Pay ₹{selectedAmount} via esewa</p>
              <div className="bg-white p-4 rounded-xl mb-4">
                <img 
                  src={getQRImage(selectedAmount)} 
                  alt={`QR Code for ₹${selectedAmount}`}
                  className="w-64 h-64 mx-auto object-contain"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/256?text=QR+Code'
                  }}
                />
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Scan this QR code with Esewa app
              </p>
              <button
                onClick={closeQR}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}

        <div className="mb-6">
          <label className="text-gray-400 block mb-2">Upload Payment Screenshot</label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-blue-500 transition">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/jpg,application/pdf"
              className="hidden"
              id="fileUpload"
            />
            <label htmlFor="fileUpload" className="cursor-pointer">
              <div className="text-3xl mb-2">📎</div>
              <p className="text-gray-400 text-sm">
                {selectedFile ? selectedFile.name : 'Click to upload screenshot'}
              </p>
              <p className="text-gray-500 text-xs mt-1">JPG, PNG or PDF (Max 5MB)</p>
            </label>
          </div>
          {selectedFile && (
            <div>
              <p className="text-green-400 text-xs mt-2">✅ File selected: {selectedFile.name}</p>
              <p className="text-blue-400 text-xs">📦 Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          )}
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
            ⏳ Submitting request...
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            isLoading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Submitting...' : '💰 Submit Deposit Request'}
        </button>

        <button
          onClick={() => navigate('/account')}
          className="w-full mt-3 text-gray-400 hover:text-white transition text-sm"
        >
          ← Back to Account
        </button>

        <p className="text-gray-500 text-xs text-center mt-4">
          Maximum file size: 5MB | Your balance will be updated after admin approval
        </p>
      </div>
    </div>
  )
}