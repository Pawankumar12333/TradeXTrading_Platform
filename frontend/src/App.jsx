import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Trading from './pages/Trading'
import History from './pages/History'
import Leaderboard from './pages/Leaderboard'
import Account from './pages/Account'
import Admin from './pages/Admin'
import Deposit from './pages/Deposit'
import Withdraw from './pages/Withdraw'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Login Route - No Layout (Clean page without sidebar) */}
        <Route path="/login" element={<Login />} />
        
        {/* Deposit & Withdraw Routes - No Layout (Clean pages) */}
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/withdraw" element={<Withdraw />} />
        
        {/* Protected Routes - With Layout (With Sidebar) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Trading />} />
          <Route path="trading" element={<Trading />} />
          <Route path="history" element={<History />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="account" element={<Account />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App