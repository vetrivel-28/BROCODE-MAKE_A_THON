import React, { useState } from 'react';
import { identityApi } from './api';

export const SignupPage: React.FC = () => {
  const [tenantName, setTenantName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tier, setTier] = useState<'FREE' | 'STANDARD' | 'CUSTOM'>('STANDARD');
  const [industry, setIndustry] = useState<'retail' | 'saas' | 'gym' | 'coaching'>('saas');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password rules validation
  const hasMinLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password does not fulfill all required criteria');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await identityApi.signup({
        tenantName,
        fullName,
        email,
        password,
        tier,
        industry
      });

      localStorage.setItem('loopdesk_access_token', res.accessToken);
      localStorage.setItem('loopdesk_refresh_token', res.refreshToken);
      localStorage.setItem('loopdesk_user', JSON.stringify(res.user));
      localStorage.setItem('loopdesk_tenant', JSON.stringify(res.tenant));

      window.location.href = '/passport';
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#6C4BFF] text-white font-black text-2xl shadow-lg">
            L
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
            Create your Loop<span className="text-[#6C4BFF] italic">Desk</span> Workspace
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Select your platform tier and industry starter pack to begin
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-100 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Company / Workspace Name
              </label>
              <input
                type="text"
                required
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Brightloop Software Ltd"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C4BFF] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Owner Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Sharma"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C4BFF] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Business Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aarav@brightloop.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C4BFF] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C4BFF] text-sm"
              />
              <div className="mt-2 text-xs space-y-1">
                <p className={hasMinLength ? 'text-[#00C2A8]' : 'text-gray-400'}>
                  ✓ More than 8 characters ({password.length}/9+)
                </p>
                <p className={hasUpper ? 'text-[#00C2A8]' : 'text-gray-400'}>
                  ✓ At least one uppercase letter (A-Z)
                </p>
                <p className={hasLower ? 'text-[#00C2A8]' : 'text-gray-400'}>
                  ✓ At least one lowercase letter (a-z)
                </p>
                <p className={hasSpecial ? 'text-[#00C2A8]' : 'text-gray-400'}>
                  ✓ At least one special symbol (!@#$%^&*)
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Select Platform Tier
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTier('FREE')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tier === 'FREE'
                      ? 'border-[#6C4BFF] bg-purple-50 ring-1 ring-[#6C4BFF]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold text-sm">Free</p>
                  <p className="text-xs text-gray-500">₹0/mo</p>
                  <span className="text-[10px] text-gray-400 block mt-1">0 Slots</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTier('STANDARD')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tier === 'STANDARD'
                      ? 'border-[#6C4BFF] bg-purple-50 ring-1 ring-[#6C4BFF]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">Standard</p>
                    <span className="text-[9px] bg-[#6C4BFF] text-white px-1.5 py-0.5 rounded-full">Popular</span>
                  </div>
                  <p className="text-xs text-gray-500">₹580/mo</p>
                  <span className="text-[10px] text-[#6C4BFF] block mt-1 font-semibold">2 Custom Slots</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTier('CUSTOM')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tier === 'CUSTOM'
                      ? 'border-[#6C4BFF] bg-purple-50 ring-1 ring-[#6C4BFF]'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-bold text-sm">Custom</p>
                  <p className="text-xs text-gray-500">₹1,080/mo</p>
                  <span className="text-[10px] text-[#00C2A8] block mt-1 font-semibold">10 Custom Slots</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                Industry Starter Pack (Pre-seeds products, plans & taxes)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['saas', 'retail', 'gym', 'coaching'] as const).map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => setIndustry(ind)}
                    className={`py-2 px-3 rounded-xl border text-center capitalize text-xs font-medium transition-all ${
                      industry === ind
                        ? 'border-[#00C2A8] bg-teal-50 text-[#00C2A8] font-bold'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordValid}
              className="w-full py-3 px-4 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Workspace...' : 'Launch Workspace'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-[#6C4BFF] font-semibold hover:underline">
              Log in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
