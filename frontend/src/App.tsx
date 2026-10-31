import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LandingPage } from './website/LandingPage';
import { AppLauncherPage } from './app-shell/AppLauncherPage';
import {
  SignupPage,
  LoginPage,
  ResetPasswordPage,
  StaffManagementPage,
  PrivilegePassportPage
} from './features/identity';
import { CatalogPage } from './features/catalog/CatalogPage';
import { SubscriptionsPage } from './features/subscriptions/SubscriptionsPage';
import { ControlRoomPage } from './features/billing/ControlRoomPage';
import { InvoicesPage } from './features/billing/InvoicesPage';
import { OverdueBoardPage } from './features/billing/OverdueBoardPage';
import { CustomizationStudioPage } from './features/payments/CustomizationStudioPage';
import { DashboardPage } from './features/insights/DashboardPage';

const NavigationBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(2500);

  useEffect(() => {
    const rawUser = localStorage.getItem('loopdesk_user');
    const rawTenant = localStorage.getItem('loopdesk_tenant');
    if (rawUser) setUser(JSON.parse(rawUser));
    if (rawTenant) setTenant(JSON.parse(rawTenant));

    // Fetch live wallet balance if authenticated
    const token = localStorage.getItem('loopdesk_access_token');
    if (token) {
      fetch('/api/payments/wallet', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data?.balanceInr !== undefined) setWalletBalance(data.balanceInr);
        })
        .catch(() => {});
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setTenant(null);
    navigate('/');
  };

  const navLinks = [
    { name: 'Apps', path: '/apps' },
    { name: 'Passport', path: '/passport' },
    { name: 'Subscriptions', path: '/subscriptions' },
    { name: 'Invoices', path: '/invoices' },
    { name: 'Control Room', path: '/billing/control-room' },
    { name: 'Studio', path: '/studio' },
    { name: 'Dashboard', path: '/dashboard' }
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to={user ? '/apps' : '/'} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#6C4BFF] text-white flex items-center justify-center font-black text-lg shadow-sm">
              L
            </div>
            <span className="text-xl font-black tracking-tight text-[#1B1F3B]">
              Loop<span className="text-[#6C4BFF] font-handwritten text-2xl">Desk</span>
            </span>
          </Link>

          {user && (
            <nav className="hidden xl:flex items-center gap-1 text-xs font-semibold">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    location.pathname === link.path
                      ? 'text-[#6C4BFF] bg-purple-50 font-bold'
                      : 'text-gray-600 hover:text-[#1B1F3B]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Wallet Pill (Section 5 app shell requirement) */}
              <Link
                to="/studio"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#00C2A8] text-xs font-bold hover:bg-teal-100 transition-colors"
                title="Customization Wallet Balance"
              >
                <span>₹</span>
                <span>{walletBalance.toFixed(2)}</span>
              </Link>

              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[#6C4BFF] border border-purple-100 hidden sm:inline">
                {tenant?.tier || 'STANDARD'}
              </span>

              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-[#1B1F3B]">{user.fullName}</p>
                <p className="text-[10px] text-gray-400 capitalize">{user.role}</p>
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

// Route guard for authenticated areas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('loopdesk_access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// Root route: If logged in, show AppLauncherPage; if not, show LandingPage
const RootRoute: React.FC = () => {
  const token = localStorage.getItem('loopdesk_access_token');
  if (token) {
    return <AppLauncherPage />;
  }
  return <LandingPage />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#F7F8FC] flex flex-col font-['Inter',sans-serif]">
        <NavigationBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/website" element={<LandingPage />} />
            <Route
              path="/apps"
              element={
                <ProtectedRoute>
                  <AppLauncherPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/passport"
              element={
                <ProtectedRoute>
                  <PrivilegePassportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalog"
              element={
                <ProtectedRoute>
                  <CatalogPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <SubscriptionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/control-room"
              element={
                <ProtectedRoute>
                  <ControlRoomPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/overdue"
              element={
                <ProtectedRoute>
                  <OverdueBoardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/studio"
              element={
                <ProtectedRoute>
                  <CustomizationStudioPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <StaffManagementPage />
                </ProtectedRoute>
              }
            />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
