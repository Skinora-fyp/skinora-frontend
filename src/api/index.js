import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('skinora_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('skinora_user');
      sessionStorage.removeItem('skinora_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────
export const register     = (data) => api.post('/auth/register', data);
export const login        = (data) => api.post('/auth/login', data);
export const googleLogin  = (data) => api.post('/auth/google-login', data);

// ── Detection ─────────────────────────────────────────────────
export const detect = (formData) =>
  api.post('/detect', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000, // 2 min — TF models load on first call
  });

// ── Questionnaire ─────────────────────────────────────────────
export const submitAnswers = (data) => api.post('/questionnaire/submit', data);
export const getLifestyle  = ()     => api.get('/questionnaire/lifestyle');

// ── Remedies ──────────────────────────────────────────────────
export const getRemedies  = (finalCondition) => api.get(`/remedies?final_condition=${finalCondition}`);
export const getRemedy    = (id)              => api.get(`/remedies/${id}`);

// ── Tracking ──────────────────────────────────────────────────
export const createTracking   = (data) => api.post('/tracking/create', data);
export const getTracking      = ()     => api.get('/tracking');
export const recordCheckin    = (data) => api.post('/tracking/checkin', data);

export default api;
