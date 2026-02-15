import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const auth = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  signup: (data: any) => api.post('/auth/signup', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const questions = {
  getAll: (params?: any) => api.get('/questions', { params }),
  getById: (id: string) => api.get(`/questions/${id}`),
  create: (data: any) => api.post('/questions', data),
  update: (id: string, data: any) => api.put(`/questions/${id}`, data),
  delete: (id: string) => api.delete(`/questions/${id}`),
};

export const answers = {
  create: (questionId: string, data: any) => api.post(`/answers/${questionId}`, data),
  upvote: (id: string) => api.post(`/answers/${id}/upvote`),
  markBest: (id: string) => api.post(`/answers/${id}/best`),
};

export const users = {
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getSpecialists: () => api.get('/users/specialists'),
};

export default api;
