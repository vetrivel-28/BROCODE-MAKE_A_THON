export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

class ApiClient {
  private baseUrl = '/api';
  private tenantId = 'tenant_default';
  private role: 'ADMIN' | 'STAFF' | 'SUPER_ADMIN' = 'ADMIN';
  private testDate: string | null = null;

  public setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  public setRole(role: 'ADMIN' | 'STAFF' | 'SUPER_ADMIN') {
    this.role = role;
  }

  public setTestDate(dateStr: string | null) {
    this.testDate = dateStr;
  }

  public getRole(): 'ADMIN' | 'STAFF' | 'SUPER_ADMIN' {
    return this.role;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-tenant-id': this.tenantId,
      'x-user-role': this.role,
      ...(this.testDate ? { 'x-test-date': this.testDate } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errBody: { error?: ApiError } = {};
      try {
        errBody = await response.json();
      } catch (e) {
        // non-json response
      }
      const error: any = new Error(errBody.error?.message || `HTTP error ${response.status}`);
      error.status = response.status;
      error.code = errBody.error?.code || 'API_ERROR';
      error.details = errBody.error?.details;
      throw error;
    }

    if (response.headers.get('content-type')?.includes('application/pdf')) {
      return (await response.blob()) as unknown as T;
    }

    return response.json();
  }

  public get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        ).toString()}`
      : endpoint;
    return this.request<T>(url, { method: 'GET' });
  }

  public post<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public getPdfBlobUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }
}

export const api = new ApiClient();

