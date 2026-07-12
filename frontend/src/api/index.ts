const API_BASE = 'http://localhost:5000/api';

const getHeaders = (isFormData = false): Record<string, string> => {
  const token = localStorage.getItem('transitops_token');
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

async function handleResponse(res: Response) {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  post: async (endpoint: string, data: unknown) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });
    return handleResponse(res);
  },
  put: async (endpoint: string, data?: unknown) => {
    const isFormData = data instanceof FormData;
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(isFormData),
      body: isFormData ? (data as any) : data ? JSON.stringify(data) : undefined,
    });
    return handleResponse(res);
  },
  delete: async (endpoint: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
