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
  checkUpvoted: (answerIds: string[]) => api.post(`/answers/check-upvotes`, { answerIds }),
};

export const users = {
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getSpecialists: () => api.get('/users/specialists'),
  getAll: (params?: any) => api.get('/admin/users', { params }), // Optimistic
};

export const admin = {
  getStats: () => api.get('/admin/stats'), // Updated to real endpoint
  getReports: (status = 'pending') => api.get('/moderation/reports', { params: { status } }),
  getBlockedWords: () => api.get('/moderation/blocked-words'),
  addBlockedWords: (words: string[]) => api.post('/moderation/blocked-words', { words }),
  removeBlockedWord: (word: string) => api.delete(`/moderation/blocked-words/${word}`),
  bulkCreateUsers: (users: any[]) => api.post('/auth/bulk-create', { users }),

  // New Moderation Endpoints
  takeAction: (data: any) => api.post('/moderation/action', data),
  getFlaggedContent: () => api.get('/moderation/flagged'),
  scanContent: (content: string) => api.post('/moderation/scan', { content }),
  removeItem: (type: string, id: string) => api.post(`/moderation/remove/${type}/${id}`),
  banUser: (userId: string) => api.post(`/moderation/ban/${userId}`),
  unbanUser: (userId: string) => api.post(`/moderation/unban/${userId}`),
  getSystemStats: () => api.get('/moderation/stats'),
  getLogs: () => api.get('/moderation/logs'),
  checkHealth: () => api.get('/health'),
  approveUser: (userId: string) => api.patch(`/admin/users/${userId}/approve`),
  bulkApproveUsers: (userIds: string[]) => api.post('/admin/users/bulk-approve', { userIds }),
};

export const tags = {
  getAll: () => api.get('/tags'),
};

export default api;
