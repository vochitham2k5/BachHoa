import axios from 'axios';

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  // No Authorization header; rely on HttpOnly cookies
  // Attach CSRF token for unsafe methods when using cookie-based auth
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options', 'trace'].includes(method)) {
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) config.headers['X-CSRFToken'] = csrftoken;
  }
  return config;
});

// Refresh token on 401 once per request
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return api.request(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      isRefreshing = true;
      try {
        // Rotate access cookie via our endpoint
        await axios.post('/api/auth/refresh/', {}, { withCredentials: true });
        isRefreshing = false;
        processQueue(null, null);
        return api.request(originalRequest);
      } catch (err) {
        isRefreshing = false;
        processQueue(err, null);
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;