import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../services/api'

export default function Admin() {
  const navigate = useNavigate()
  const [depositRequests, setDepositRequests] = useState([])
  const [withdrawRequests, setWithdrawRequests] = useState([])
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('deposits')
  const [copySuccess, setCopySuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const ADMIN_MOBILE = '9807548664'

  useEffect(() => {
    const token = localStorage.getItem('token')
    const currentUser = localStorage.getItem('currentUser')

    if (!token || !currentUser) {
      navigate('/login')
      return
    }

    const user = JSON.parse(currentUser)
    if (user.mobile !== ADMIN_MOBILE) {
      navigate('/')
      return
    }

    loadDepositRequests()
    loadWithdrawRequests()
  }, [navigate])

  // Load deposit requests from backend
  const loadDepositRequests = async () => {
    try {
      const response = await API.get('/admin/deposits')
      setDepositRequests(response.data)
    } catch (error) {
      console.error('Failed to load deposit requests:', error)
    }
  }

  // Load withdraw requests from backend
  const loadWithdrawRequests = async () => {
    try {
      const response = await API.get('/admin/withdraws')
      setWithdrawRequests(response.data)
    } catch (error) {
      console.error('Failed to load withdraw requests:', error)
    }
  }

  const copyUID = (uid) => {
    navigator.clipboard.writeText(uid.toString())
    setCopySuccess(`✅ Copied: ${uid}`)
    setTimeout(() => setCopySuccess(''), 2000)
  }

  // ✅ FIX: `req.proof` is a base64 data: URI (from FileReader.readAsDataURL on the Deposit page).
  // Browsers (esp. Chrome) block/blank-out data: URIs opened directly via window.open in a new tab.
  // Fix: convert base64 -> Blob -> object URL, which opens reliably.
  const openProof = (dataUri) => {
    try {
      const [meta, base64Data] = dataUri.split(',')
      const mimeMatch = meta.match(/data:(.*);base64/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream'

      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })
      const blobUrl = URL.createObjectURL(blob)

      window.open(blobUrl, '_blank')

      // Free memory after giving the browser time to load it
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (error) {
      console.error('Failed to open proof:', error)
      setMessage('❌ Failed to open payment proof')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  // Approve Deposit
  const approveDeposit = async (request) => {
    setLoading(true)
    try {
      await API.post('/admin/deposits/approve', {
        requestId: request.id,
        uniqueId: request.unique_id,
        amount: request.amount
      })
      setMessage(`✅ Approved ₹${request.amount} for ${request.name}`)
      loadDepositRequests()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to approve deposit')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  // Reject Deposit
  const rejectDeposit = async (request) => {
    setLoading(true)
    try {
      await API.post('/admin/deposits/reject', {
        requestId: request.id
      })
      setMessage(`❌ Rejected ₹${request.amount} for ${request.name}`)
      loadDepositRequests()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to reject deposit')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  // Approve Withdraw
  const approveWithdraw = async (request) => {
    setLoading(true)
    try {
      await API.post('/admin/withdraws/approve', {
        requestId: request.id,
        uniqueId: request.unique_id,
        amount: request.amount
      })
      setMessage(`✅ Withdraw ₹${request.amount} approved for ${request.name}`)
      loadWithdrawRequests()
      setTimeout(() => setMessage(''), 4000)
    } catch (error) {
      setMessage('❌ Failed to approve withdraw')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  // Reject Withdraw
  const rejectWithdraw = async (request) => {
    setLoading(true)
    try {
      await API.post('/admin/withdraws/reject', {
        requestId: request.id,
        uniqueId: request.unique_id,
        amount: request.amount
      })
      setMessage(`❌ Withdraw ₹${request.amount} rejected for ${request.name}`)
      loadWithdrawRequests()
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('❌ Failed to reject withdraw')
      setTimeout(() => setMessage(''), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">⚙️ Admin Panel</h1>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('currentUser')
              navigate('/login')
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-3 rounded-lg text-white text-center ${
            message.includes('✅') ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {message}
          </div>
        )}

        {copySuccess && (
          <div className="mb-6 p-3 rounded-lg bg-blue-600 text-white text-center">
            {copySuccess}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'deposits' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            💰 Deposits ({depositRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('withdraws')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'withdraws' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
          >
            💸 Withdraws ({withdrawRequests.length})
          </button>
        </div>

        {/* Deposit Requests Tab */}
        {activeTab === 'deposits' && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">💰 Pending Deposit Requests</h2>

            {depositRequests.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No pending deposit requests</p>
            ) : (
              <div className="space-y-4">
                {depositRequests.map((req) => (
                  <div key={req.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{req.name}</p>
                        <p className="text-gray-400 text-sm">📱 {req.mobile}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-400 text-sm">🆔 {req.unique_id}</p>
                          <button
                            onClick={() => copyUID(req.unique_id)}
                            className="text-blue-400 text-xs hover:text-blue-300"
                          >
                            📋 Copy
                          </button>
                        </div>
                        <p className="text-green-400 font-bold mt-1">Amount: ₹{req.amount}</p>
                        <p className="text-gray-500 text-xs mt-1">Requested: {new Date(req.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveDeposit(req)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => rejectDeposit(req)}
                          disabled={loading}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    </div>

                    {/* Payment Proof */}
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <p className="text-gray-400 text-sm mb-2">Payment Proof:</p>
                      {req.proof_type?.startsWith('image/') ? (
                        <img
                          src={req.proof}
                          alt="Payment Proof"
                          className="max-w-full max-h-48 rounded-lg cursor-pointer"
                          onClick={() => openProof(req.proof)}
                        />
                      ) : (
                        <button
                          onClick={() => openProof(req.proof)}
                          className="text-blue-400 hover:underline text-sm"
                        >
                          📄 View PDF
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Withdraw Requests Tab */}
        {activeTab === 'withdraws' && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4">💸 Pending Withdraw Requests</h2>

            {withdrawRequests.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No pending withdraw requests</p>
            ) : (
              <div className="space-y-4">
                {withdrawRequests.map((req) => {
                  const commission = req.amount * 0.02
                  const netAmount = req.amount - commission

                  return (
                    <div key={req.id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-semibold">{req.name}</p>
                          <p className="text-gray-400 text-sm">📱 {req.mobile}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-gray-400 text-sm">🆔 {req.unique_id}</p>
                            <button
                              onClick={() => copyUID(req.unique_id)}
                              className="text-blue-400 text-xs hover:text-blue-300"
                            >
                              📋 Copy
                            </button>
                          </div>
                          <p className="text-orange-400 font-bold mt-1">Amount: ₹{req.amount}</p>
                          <p className="text-yellow-400 text-xs">Commission (2%): ₹{commission.toFixed(2)}</p>
                          <p className="text-green-400 text-xs">Net Payable: ₹{netAmount.toFixed(2)}</p>
                          <p className="text-blue-400 text-xs mt-1">⚠️ Amount will be deducted after approval</p>
                          <p className="text-gray-500 text-xs mt-1">Requested: {new Date(req.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveWithdraw(req)}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                          >
                            ✅ Approve & Deduct
                          </button>
                          <button
                            onClick={() => rejectWithdraw(req)}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
