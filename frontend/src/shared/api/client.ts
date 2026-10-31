// Shared API Client for LoopDesk

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("loopdesk_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      (errorBody as { message?: string; error?: string }).message ||
      (errorBody as { message?: string; error?: string }).error ||
      `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
