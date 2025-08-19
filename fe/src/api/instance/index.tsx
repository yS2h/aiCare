import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, 
});

api.interceptors.request.use((config) => {

  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    '';

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
