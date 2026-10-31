import React, { useState } from 'react';
import { identityApi } from './api';

export const ResetPasswordPage: React.FC = () => {
  const [step, setStep] = useState<'REQUEST' | 'SUBMIT'>('REQUEST');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password rules validation
  const hasMinLength = newPassword.length > 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await identityApi.forgotPassword(email);
      setMessage(res.message);
      if (res.resetToken) {
        // Automatically prefill for demo convenience
        setToken(res.resetToken);
        setStep('SUBMIT');
      }
    } catch (err: any) {
      setError(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setError('Password must satisfy all security rules');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await identityApi.resetPassword(token, newPassword);
      setMessage(res.message);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
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
            Reset Password
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {step === 'REQUEST'
              ? 'Enter your registered email to receive a 30-minute reset token'
              : 'Enter your new strong password'}
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-6 shadow-sm rounded-2xl border border-gray-100 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200">
              {message}
            </div>
          )}

          {step === 'REQUEST' ? (
            <form onSubmit={handleRequestToken} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Registered Email
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C4BFF] text-xs font-mono bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#6C4BFF] text-sm"
                />
                <div className="mt-2 text-xs space-y-1">
                  <p className={hasMinLength ? 'text-[#00C2A8]' : 'text-gray-400'}>
                    ✓ More than 8 characters ({newPassword.length}/9+)
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

              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full py-3 px-4 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center text-xs text-gray-500">
            Remembered your credentials?{' '}
            <a href="/login" className="text-[#6C4BFF] font-semibold hover:underline">
              Back to log in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

