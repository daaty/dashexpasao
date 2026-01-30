import axios from 'axios';

// Em desenvolvimento, usar caminho relativo para o proxy do Vite funcionar
// Em produção, usar URL absoluta do backend
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment 
  ? '/api'  // Usar proxy do Vite em desenvolvimento
  : (import.meta.env.VITE_API_URL || 'http://backend.148.230.73.27.nip.io/api');

console.log('🔧 API Configuration:');
console.log('   Environment:', isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION');
console.log('   VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('   API_BASE_URL:', API_BASE_URL);
console.log('   Mode:', import.meta.env.MODE);

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Não logar 404s de rides (esperados quando cidade não tem dados)
    if (error.response?.status === 404 && error.config?.url?.includes('/rides/city/')) {
      return Promise.reject(error);
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
