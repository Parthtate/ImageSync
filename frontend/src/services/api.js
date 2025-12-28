import axios from 'axios';

// Use environment variable for production, fallback to localhost for dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

console.log('🌐 API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('📤 Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response from server');
    } else {
      console.error('Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API Functions - NAMED EXPORTS
export const importFromGoogleDrive = async (folderUrl) => {
  const response = await api.post('/import/google-drive', { folderUrl });
  return response.data;
};

export const getImages = async (source = '', limit = 100, offset = 0) => {
  const params = new URLSearchParams();
  if (source) params.append('source', source);
  params.append('limit', limit);
  params.append('offset', offset);
  
  const response = await api.get(`/images?${params.toString()}`);
  return response.data;
};

export const getJobStatus = async (jobId) => {
  const response = await api.get(`/jobs/${jobId}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Default export
export default api;
