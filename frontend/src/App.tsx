import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  SignupPage,
  LoginPage,
  ResetPasswordPage,
  StaffManagementPage,
  PrivilegePassportPage
} from './features/identity';

const NavigationBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('loopdesk_user');
    const rawTenant = localStorage.getItem('loopdesk_tenant');
    if (rawUser) setUser(JSON.parse(rawUser));
    if (rawTenant) setTenant(JSON.parse(rawTenant));
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setTenant(null);
    navigate('/login');
  };

  // Hide nav on bare auth pages if not logged in
  const isAuthPage = ['/login', '/signup', '/reset-password'].includes(location.pathname);

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/passport" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#6C4BFF] text-white flex items-center justify-center font-black text-lg shadow-sm">
              L
            </div>
            <span className="text-xl font-black tracking-tight text-[#1B1F3B]">
              Loop<span className="text-[#6C4BFF] font-handwritten text-2xl">Desk</span>
            </span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                to="/passport"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/passport' || location.pathname === '/'
                    ? 'text-[#6C4BFF] bg-purple-50 font-semibold'
                    : 'text-gray-600 hover:text-[#1B1F3B]'
                }`}
              >
                Privilege Passport
              </Link>
              <Link
                to="/staff"
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  location.pathname === '/staff'
                    ? 'text-[#6C4BFF] bg-purple-50 font-semibold'
                    : 'text-gray-600 hover:text-[#1B1F3B]'
                }`}
              >
                Team Access
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#1B1F3B]">{user.fullName}</p>
                <p className="text-[11px] text-gray-400 capitalize">
                  {tenant?.name || 'Workspace'} • <span className="text-[#6C4BFF] font-semibold">{user.role}</span>
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-red-600 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs text-gray-600 hover:text-[#1B1F3B] font-semibold px-3 py-2"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-xs bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all"
              >
                Start Free Trial
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col">
        <NavigationBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<PrivilegePassportPage />} />
            <Route path="/passport" element={<PrivilegePassportPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/staff" element={<StaffManagementPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
