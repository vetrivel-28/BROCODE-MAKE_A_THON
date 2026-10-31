const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

function getToken(): string | null {
  return localStorage.getItem('accessToken');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

function clearStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<unknown> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Attempt token refresh
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearStorage();
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    try {
      const refreshRes = await fetch(`${BASE_URL}/api/identity/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh failed');
      }

      const data = await refreshRes.json() as { accessToken: string; refreshToken: string };
      setTokens(data.accessToken, data.refreshToken);

      // Retry original request
      const retryRes = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${data.accessToken}`,
        },
      });

      if (!retryRes.ok) {
        const errData = await retryRes.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
        throw new Error(errData.message ?? 'Request failed');
      }

      return retryRes.json();
    } catch {
      clearStorage();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const errData = await response.json().catch(() => ({ message: 'Request failed' })) as { message?: string };
    throw new Error(errData.message ?? 'Request failed');
  }

  if (response.status === 204) return null;

  return response.json();
}

export const api = {
  get: (path: string) => apiFetch(path, { method: 'GET' }),
  post: (path: string, body?: unknown) =>
    apiFetch(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: unknown) =>
    apiFetch(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
};

export default api;
