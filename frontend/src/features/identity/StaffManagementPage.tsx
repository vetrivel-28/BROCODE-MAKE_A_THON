import React, { useEffect, useState } from 'react';
import { identityApi } from './api';

export const StaffManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Password rules validation
  const hasMinLength = password.length > 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await identityApi.listUsers();
      setUsers(res.users);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setSubmitting(true);
    setError(null);

    try {
      await identityApi.createStaff({ fullName, email, password });
      setShowModal(false);
      setFullName('');
      setEmail('');
      setPassword('');
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1B1F3B] p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team & Staff Access</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage workspace employees and assign role privileges
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white font-medium text-sm shadow-sm transition-all"
          >
            + Add Staff Member
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400">Loading team members...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 font-medium">No staff members found.</p>
              <p className="text-xs text-gray-400 mt-1">Add your first employee to collaborate.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[11px] tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium">{u.fullName}</td>
                    <td className="py-4 px-6 text-gray-500">{u.email}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-[#6C4BFF]'
                            : u.role === 'STAFF'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-[#00C2A8]'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal: Add Staff */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Add Staff Member</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#6C4BFF] focus:outline-none"
                  />
                  <div className="mt-2 text-[11px] space-y-0.5">
                    <p className={hasMinLength ? 'text-[#00C2A8]' : 'text-gray-400'}>
                      ✓ &gt; 8 chars ({password.length}/9+)
                    </p>
                    <p className={hasUpper ? 'text-[#00C2A8]' : 'text-gray-400'}>
                      ✓ Uppercase letter (A-Z)
                    </p>
                    <p className={hasLower ? 'text-[#00C2A8]' : 'text-gray-400'}>
                      ✓ Lowercase letter (a-z)
                    </p>
                    <p className={hasSpecial ? 'text-[#00C2A8]' : 'text-gray-400'}>
                      ✓ Special character (!@#$)
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !isPasswordValid}
                    className="px-4 py-2 rounded-xl bg-[#6C4BFF] hover:bg-[#5839e6] text-white text-sm font-bold shadow disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Staff User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
