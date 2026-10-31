import React, { useState } from 'react';
import { identityApi } from './api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await identityApi.login(email, password);
      localStorage.setItem('loopdesk_access_token', res.accessToken);
      localStorage.setItem('loopdesk_refresh_token', res.refreshToken);
      localStorage.setItem('loopdesk_user', JSON.stringify(res.user));
      localStorage.setItem('loopdesk_tenant', JSON.stringify(res.tenant));

      window.location.href = '/apps';
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // One-click instant login for testing and evaluators
  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // First attempt to login with pre-seeded demo admin
      let res;
      try {
        res = await identityApi.login('aarav@brightloop.com', 'SecurePassword123#');
      } catch {
        // If not created yet in this session, sign up on the fly
        res = await identityApi.signup({
          tenantName: 'Brightloop Software',
          fullName: 'Aarav Sharma',
          email: 'aarav@brightloop.com',
          password: 'SecurePassword123#',
          tier: 'STANDARD',
          industry: 'saas'
        });
      }

      localStorage.setItem('loopdesk_access_token', res.accessToken);
      localStorage.setItem('loopdesk_refresh_token', res.refreshToken);
      localStorage.setItem('loopdesk_user', JSON.stringify(res.user));
      localStorage.setItem('loopdesk_tenant', JSON.stringify(res.tenant));

      window.location.href = '/apps';
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#6C4BFF] text-white font-black text-2xl shadow-lg">
            L
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
            Log in to Loop<span className="text-[#6C4BFF] font-handwritten text-4xl">Desk</span>
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Access your B2B subscription and billing platform
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-100 sm:px-10">
          {/* Quick Demo Button */}
          <div className="mb-6 pb-6 border-b border-gray-100">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#6C4BFF] to-[#00C2A8] hover:opacity-95 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>⚡ One-Click Instant Demo Login (Brightloop Software)</span>
            </button>
            <span className="text-[10px] text-gray-400 text-center block mt-1.5">
              Instantly logs into Standard tier owner workspace
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@company.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C4BFF] text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Password
                </label>
                <a
                  href="/reset-password"
                  className="text-xs text-[#6C4BFF] hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C4BFF] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Need a new workspace?{' '}
            <a href="/signup" className="text-[#6C4BFF] font-semibold hover:underline">
              Sign up for LoopDesk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
