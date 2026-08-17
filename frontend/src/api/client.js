// Central place for all backend calls. Base URL comes from an env var so the
// same build can point at localhost during dev and your deployed EC2/ALB URL in production.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  getTasks: (token) => request('/tasks', { token }),
  createTask: (payload, token) => request('/tasks', { method: 'POST', body: payload, token }),
  updateTask: (id, payload, token) => request(`/tasks/${id}`, { method: 'PUT', body: payload, token }),
  deleteTask: (id, token) => request(`/tasks/${id}`, { method: 'DELETE', token }),

  getInventory: (token) => request('/inventory', { token }),
  createItem: (payload, token) => request('/inventory', { method: 'POST', body: payload, token }),
  updateItem: (id, payload, token) => request(`/inventory/${id}`, { method: 'PUT', body: payload, token }),
  deleteItem: (id, token) => request(`/inventory/${id}`, { method: 'DELETE', token }),
};
