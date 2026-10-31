// API client for Identity & Platform Tiers module

const API_BASE = '/api/identity';

export interface AuthResponse {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'STAFF' | 'CUSTOMER';
    tenantId: string;
  };
  tenant: {
    id: string;
    name: string;
    slug?: string;
    tier: 'FREE' | 'STANDARD' | 'CUSTOM';
    industry?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface PrivilegePassportData {
  tenant: {
    id: string;
    name: string;
    industry: string;
    payBeyondCap: boolean;
  };
  currentTier: {
    code: 'FREE' | 'STANDARD' | 'CUSTOM';
    name: string;
    monthlyPricePaise: number;
    monthlyPriceInr: number;
    description: string;
  };
  customizationSlots: {
    total: number;
    used: number;
    remaining: number;
  };
  wallet: {
    balancePaise: number;
    balanceInr: number;
  };
  features: Array<{
    key: string;
    name: string;
    minTier: string;
    unlocked: boolean;
    upgradeRequired: string | null;
  }>;
  upgradeOptions: Array<{
    tier: 'STANDARD' | 'CUSTOM';
    priceMonthlyInr: number;
    slots: number;
    headline: string;
  }>;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('loopdesk_access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const identityApi = {
  async signup(data: any): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Signup failed');
    return json;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Login failed');
    return json;
  },

  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Password reset request failed');
    return json;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Password reset failed');
    return json;
  },

  async getPassport(): Promise<PrivilegePassportData> {
    const res = await fetch(`${API_BASE}/passport`, {
      headers: { ...getAuthHeader() }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to fetch Privilege Passport');
    return json;
  },

  async listUsers(): Promise<{ users: any[] }> {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { ...getAuthHeader() }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to list users');
    return json;
  },

  async createStaff(data: { fullName: string; email: string; password: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to create staff');
    return json;
  },

  async upgradeTier(data: { targetTier: 'STANDARD' | 'CUSTOM'; razorpayPaymentId: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Failed to upgrade tier');
    return json;
  }
};

