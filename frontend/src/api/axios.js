import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    'X-Client': 'RAKSHAK-BSIP/2.4',
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.warn('[RAKSHAK API]', err.config?.url, err.message);
    return Promise.reject(err);
  },
);

export default api;
