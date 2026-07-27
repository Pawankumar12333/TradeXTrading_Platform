import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import API, { login, forgotPassword, resetPassword } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState('login')
  const [formData, setFormData] = useState({
    mobile: '',
    email: '',
    password: '',
    name: '',
    gender: 'male'
  })
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const [resetEmail, setResetEmail] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [referralCoupon, setReferralCoupon] = useState('')
  const [couponValid, setCouponValid] = useState(null)
  const [couponMessage, setCouponMessage] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/')
    }
  }, [navigate])

  const hasSpecialChar = (str) => {
    const specialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
    return specialChars.test(str);
  }

  // ==================== FORGOT PASSWORD FUNCTIONS ====================
  
  const sendResetOTP = async () => {
    if (!resetEmail) {
      setError('Please enter your email address')
      return
    }
    
    setLoading(true)
    try {
      const response = await forgotPassword({ email: resetEmail })
      if (response.data.success) {
        setStep('reset')
        setError('')
        setResendTimer(60)
        const timer = setInterval(() => {
          setResendTimer(prev => {
            if (prev <= 1) clearInterval(timer)
            return prev - 1
          })
        }, 1000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyResetOTP = async () => {
    if (!otp) {
      setError('Please enter OTP')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!hasSpecialChar(newPassword)) {
      setError('Password must contain at least one special character (!@#$%^&*)')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }
    
    setLoading(true)
    try {
      const response = await resetPassword({
        email: resetEmail,
        otp: otp,
        newPassword: newPassword
      })
      if (response.data.success) {
        setSuccess('Password reset successfully! Please login with new password.')
        setStep('login')
        setResetEmail('')
        setOtp('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // ==================== REGISTRATION FUNCTIONS ====================
  
  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!formData.name) {
      setError('Please enter your name')
      return
    }
    if (!formData.mobile || formData.mobile.length !== 10) {
      setError('Enter valid 10 digit mobile number')
      return
    }
    if (!formData.email) {
      setError('Please enter email address')
      return
    }
    if (!formData.password) {
      setError('Please enter password')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!hasSpecialChar(formData.password)) {
      setError('Password must contain at least one special character (!@#$%^&*)')
      return
    }
    
    setLoading(true)
    try {
      const response = await API.post('/auth/register', {
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        referralCoupon: referralCoupon || undefined
      })
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('currentUser', JSON.stringify(response.data.user))
        setSuccess('Registration successful! Redirecting...')
        setTimeout(() => navigate('/'), 1500)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ==================== LOGIN FUNCTIONS ====================
  
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    
    const loginValue = formData.mobile
    if (!loginValue || !formData.password) {
      setError('Please enter mobile/email and password')
      return
    }

    setLoading(true)
    try {
      const response = await login({
        loginValue: loginValue,
        password: formData.password
      })
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('currentUser', JSON.stringify(response.data.user))
        setSuccess('Login successful!')
        setTimeout(() => navigate('/'), 1000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const checkCoupon = (code) => {
    if (!code) {
      setCouponValid(null)
      setCouponMessage('')
      return
    }
    setCouponValid(true)
    setCouponMessage(`✅ Valid coupon! You will get ₹10 bonus. Referrer gets ₹20.`)
    setTimeout(() => setCouponMessage(''), 3000)
  }

  const resendOTP = () => {
    if (resendTimer > 0) return
    if (step === 'reset') {
      sendResetOTP()
    }
  }

  // ==================== REGISTER FORM ====================
  if (!isLogin && step === 'register') {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-70 animate-pulse"></div>
          
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
            
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">📝</span>
              </div>
              <h1 className="text-xl font-bold text-white">Create Account</h1>
              <p className="text-white/60 text-xs mt-1">Enter your details</p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => { setIsLogin(true); setStep('login'); setError(''); setSuccess('') }}
                className="flex-1 py-1.5 rounded-lg font-semibold text-sm bg-white/10 text-white/70 hover:text-white"
              >
                🔐 Login
              </button>
              <button
                className="flex-1 py-1.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg"
              >
                📝 Register
              </button>
            </div>

            {error && <div className="bg-red-500/20 text-red-200 p-2 rounded-lg mb-3 text-sm">{error}</div>}

            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="block text-white/70 text-xs mb-1">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">👤</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 pl-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-white/70 text-xs mb-1">Mobile Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">📱</span>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="w-full p-2 pl-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="9876543210"
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-white/70 text-xs mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">✉️</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2 pl-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-white/70 text-xs mb-1">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full p-2 pl-9 pr-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Min 6 chars + special char"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50"
                  >
                    {showPassword ? "👁️" : "🔒"}
                  </button>
                </div>
                <p className="text-white/40 text-[10px] mt-1">Must contain at least one special character (!@#$%^&*)</p>
              </div>

              <div className="mb-3">
                <label className="block text-white/70 text-xs mb-1">Gender</label>
                <div className="flex gap-3">
                  <label className={`flex items-center gap-1.5 p-2 rounded-lg cursor-pointer flex-1 justify-center text-sm ${
                    formData.gender === 'male' ? 'bg-blue-500/30 border border-blue-500/50' : 'bg-white/10'
                  }`}>
                    <input type="radio" name="gender" value="male" checked={formData.gender === 'male'} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="hidden" />
                    <span className="text-lg">👨</span>
                    <span className="text-white text-xs">Male</span>
                  </label>
                  <label className={`flex items-center gap-1.5 p-2 rounded-lg cursor-pointer flex-1 justify-center text-sm ${
                    formData.gender === 'female' ? 'bg-pink-500/30 border border-pink-500/50' : 'bg-white/10'
                  }`}>
                    <input type="radio" name="gender" value="female" checked={formData.gender === 'female'} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="hidden" />
                    <span className="text-lg">👩</span>
                    <span className="text-white text-xs">Female</span>
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-white/70 text-xs mb-1">Referral Coupon (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">🎁</span>
                  <input
                    type="text"
                    value={referralCoupon}
                    onChange={(e) => {
                      setReferralCoupon(e.target.value)
                      checkCoupon(e.target.value)
                    }}
                    className="w-full p-2 pl-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter coupon code"
                  />
                </div>
                {couponValid && <p className="text-green-400 text-[10px] mt-1">✅ Valid coupon! You get ₹10 bonus.</p>}
                {couponMessage && !couponValid && <p className="text-red-400 text-[10px] mt-1">{couponMessage}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-2 rounded-lg transition transform hover:scale-105 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Registering...' : '📝 Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ==================== FORGOT PASSWORD FORM ====================
  if (!isLogin && step === 'forgot') {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-70 animate-pulse"></div>
          
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
            
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">🔐</span>
              </div>
              <h1 className="text-xl font-bold text-white">Forgot Password?</h1>
              <p className="text-white/60 text-xs mt-1">Enter your email to reset password</p>
            </div>

            <button
              onClick={() => { setIsLogin(true); setStep('login'); setError(''); setSuccess('') }}
              className="mb-3 text-white/60 hover:text-white text-xs flex items-center gap-1"
            >
              ← Back to Login
            </button>

            {error && <div className="bg-red-500/20 text-red-200 p-2 rounded-lg mb-3 text-sm">{error}</div>}

            <div className="mb-4">
              <label className="block text-white/70 text-xs mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">✉️</span>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full p-2 pl-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <button
              onClick={sendResetOTP}
              disabled={loading}
              className={`w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-2 rounded-lg transition transform hover:scale-105 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Sending...' : 'Send Reset OTP'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ==================== RESET PASSWORD FORM ====================
  if (!isLogin && step === 'reset') {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-70 animate-pulse"></div>
          
          <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
            
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">✉️</span>
              </div>
              <h1 className="text-xl font-bold text-white">Reset Password</h1>
              <p className="text-white/60 text-xs mt-1">OTP sent to {resetEmail}</p>
            </div>

            <button
              onClick={() => { setStep('forgot'); setError(''); }}
              className="mb-3 text-white/60 hover:text-white text-xs flex items-center gap-1"
            >
              ← Back
            </button>

            {error && <div className="bg-red-500/20 text-red-200 p-2 rounded-lg mb-3 text-sm">{error}</div>}

            <div className="mb-3">
              <label className="block text-white/70 text-xs mb-1">Enter OTP</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">🔢</span>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full p-2 pl-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="6-digit OTP"
                  maxLength="6"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-white/70 text-xs mb-1">New Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">🔒</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 pl-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min 6 chars + special char"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-white/70 text-xs mb-1">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">✓</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 pl-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            {resendTimer > 0 && (
              <p className="text-white/50 text-[10px] text-center mb-3">
                Resend OTP in {resendTimer} seconds
              </p>
            )}

            <button
              onClick={verifyResetOTP}
              disabled={loading}
              className={`w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-semibold py-2 rounded-lg transition transform hover:scale-105 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            {resendTimer === 0 && (
              <button
                onClick={resendOTP}
                className="w-full mt-2 text-white/60 hover:text-white text-xs transition"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ==================== MAIN LOGIN FORM ====================
  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-70 animate-pulse"></div>
        
        <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20">
          
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🔐</span>
            </div>
            <h1 className="text-xl font-bold text-white">Welcome Back!</h1>
            <p className="text-white/60 text-xs mt-1">Login to continue trading</p>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              className="flex-1 py-1.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
            >
              🔐 Login
            </button>
            <button
              type="button"
              onClick={() => { 
                setIsLogin(false); 
                setStep('register'); 
                setError(''); 
                setSuccess(''); 
                setFormData({...formData, name: '', mobile: '', email: '', password: ''})
              }}
              className="flex-1 py-1.5 rounded-lg font-semibold text-sm bg-white/10 text-white/70 hover:text-white"
            >
              📝 Register
            </button>
          </div>

          {error && <div className="bg-red-500/20 text-red-200 p-2 rounded-lg mb-3 text-sm">{error}</div>}
          {success && <div className="bg-green-500/20 text-green-200 p-2 rounded-lg mb-3 text-sm">{success}</div>}

          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="block text-white/70 text-xs mb-1">Mobile or Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">📱✉️</span>
                <input
                  type="text"
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full p-2 pl-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mobile or Email"
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-white/70 text-xs mb-1">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 text-sm">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-2 pl-9 pr-9 rounded-lg bg-white/10 text-white text-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50"
                >
                  {showPassword ? "👁️" : "🔒"}
                </button>
              </div>
            </div>

            <div className="text-right mb-4">
              <button
                type="button"
                onClick={() => { setIsLogin(false); setStep('forgot'); setError(''); setResetEmail('') }}
                className="text-white/40 hover:text-white text-[10px] transition"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition transform hover:scale-105 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Logging in...' : '🔐 Login'}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-[10px] text-white/50 text-center">
              🎁 New user? 
              <button 
                type="button"
                onClick={() => { 
                  setIsLogin(false); 
                  setStep('register'); 
                  setError(''); 
                  setSuccess(''); 
                  setFormData({...formData, name: '', mobile: '', email: '', password: ''})
                }}
                className="font-semibold underline ml-1 text-blue-300 hover:text-blue-200 transition text-[10px]"
              >
                Register here
              </button> 
              to get ₹10 bonus!
            </p>
          </div>
          <p>Note: Please always login your phone number </p>
          <p>contact us : yashyashbhuj@gmail.com</p>
        </div>
      </div>
    </div>
  )
}