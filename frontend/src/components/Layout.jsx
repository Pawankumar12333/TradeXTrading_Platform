import { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const ADMIN_MOBILE = '9807548664';

  const checkAuth = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const currentUserStr = localStorage.getItem('currentUser');
      
      if (!token || !currentUserStr) {
        navigate('/login', { replace: true });
        return;
      }
      
      const currentUser = JSON.parse(currentUserStr);
      setUser(currentUser);
      setIsAdmin(currentUser.isAdmin || currentUser.mobile === ADMIN_MOBILE);
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <div className="text-white text-xl ml-3">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-page">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-black/70 backdrop-blur-md text-white transition-all duration-300 flex flex-col fixed h-full z-50 border-r border-white/10`}>
        <button
          onClick={() => setIsSidebarOpen(prev => !prev)}
          className="p-4 hover:bg-white/10 text-left transition"
          aria-label="Toggle Sidebar"
        >
          {isSidebarOpen ? '◀ Collapse' : '▶'}
        </button>

        <nav className="flex-1 mt-4">
          <Link to="/" className="flex items-center p-4 hover:bg-white/10 transition">
            <span className="text-xl">📈</span>
            {isSidebarOpen && <span className="ml-3">Trading</span>}
          </Link>
          <Link to="/history" className="flex items-center p-4 hover:bg-white/10 transition">
            <span className="text-xl">📜</span>
            {isSidebarOpen && <span className="ml-3">History</span>}
          </Link>
          <Link to="/leaderboard" className="flex items-center p-4 hover:bg-white/10 transition">
            <span className="text-xl">🏆</span>
            {isSidebarOpen && <span className="ml-3">Leaderboard</span>}
          </Link>
          <Link to="/deposit" className="flex items-center p-4 hover:bg-white/10 transition">
            <span className="text-xl">💰</span>
            {isSidebarOpen && <span className="ml-3">Deposit</span>}
          </Link>
          <Link to="/withdraw" className="flex items-center p-4 hover:bg-white/10 transition">
            <span className="text-xl">💳</span>
            {isSidebarOpen && <span className="ml-3">Withdraw</span>}
          </Link>
          {isAdmin && (
            <Link to="/admin" className="flex items-center p-4 hover:bg-white/10 transition">
              <span className="text-xl">⚙️</span>
              {isSidebarOpen && <span className="ml-3">Admin Panel</span>}
            </Link>
          )}
        </nav>

        <div className="border-t border-white/10 mt-auto">
          <Link to="/account" className="flex items-center p-4 hover:bg-white/10 transition">
            <span className="text-xl">👤</span>
            {isSidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="font-semibold text-sm truncate">{user.name}</p>
                <p className="text-sm text-gray-300">Balance: ₹{user.balance || 0}</p>
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center p-4 hover:bg-red-600/50 transition text-left"
          >
            <span className="text-xl">🚪</span>
            {isSidebarOpen && <span className="ml-3">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Outlet />
      </div>
    </div>
  );
}