let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve());
  failedQueue = [];
}

export const BASE_URL = import.meta.env.PROD ? import.meta.env.VITE_API_URL : '';

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('brahm_access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...(options.headers || {})
  };

  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const res = await fetch(fullUrl, { ...options, headers, credentials: 'include' });

  if (res.status !== 401) return res;

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => {
      const newToken = localStorage.getItem('brahm_access_token');
      return fetch(fullUrl, { ...options, headers: { ...headers, Authorization: 'Bearer ' + newToken }, credentials: 'include' });
    });
  }

  isRefreshing = true;

  try {
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!refreshRes.ok) throw new Error('Refresh failed');
    const data = await refreshRes.json();
    localStorage.setItem('brahm_access_token', data.accessToken);
    processQueue(null);
    const newToken = data.accessToken;
    return fetch(fullUrl, { ...options, headers: { ...headers, Authorization: 'Bearer ' + newToken }, credentials: 'include' });
  } catch (err) {
    processQueue(err);
    localStorage.removeItem('brahm_access_token');
    window.location.href = '/auth';
    throw err;
  } finally {
    isRefreshing = false;
  }
}
