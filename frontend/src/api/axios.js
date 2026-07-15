import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3000' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = 'Bearer ' + token;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response && err.response.status === 401) {
      localStorage.clear();
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
