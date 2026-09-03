import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Login from './pages/Login';
import Trading from './pages/Trading';
import History from './pages/History';
import Leaderboard from './pages/Leaderboard';
import Account from './pages/Account';
import Admin from './pages/Admin';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import './App.css';

// ============================================
// 🔒 PROTECTED ROUTE COMPONENT
// ============================================
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('currentUser');
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// ============================================
// 👑 ADMIN ROUTE COMPONENT
// ============================================
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('currentUser');
  let user = null;
  
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!user.isAdmin && user.isAdmin !== true && user.mobile !== '9807548664') {
    return <Navigate to="/trading" replace />;
  }
  
  return children;
};

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <div className="text-white text-xl ml-3">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* 🔓 PUBLIC ROUTES - No Layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/withdraw" element={<Withdraw />} />
        
        {/* 🔒 PROTECTED ROUTES - With Layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/trading" replace />} />
          <Route path="trading" element={<Trading />} />
          <Route path="history" element={<History />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="account" element={<Account />} />
          
          {/* 👑 ADMIN ROUTE */}
          <Route path="admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
        </Route>
        
        {/* 404 NOT FOUND */}
        <Route path="*" element={<Navigate to="/trading" replace />} />
      </Routes>
    </Router>
  );
}

export default App;