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

// Simple in-memory cache
const cache = new Map<string, { timestamp: number, response: any }>();
const CACHE_TTL = 45 * 1000; // 45 seconds

const cachedGet = async (url: string, config?: any) => {
  const token = localStorage.getItem('token');
  // Include token in key to segregate cache by user
  const key = `${token || 'anon'}:${url}:${JSON.stringify(config?.params || {})}`;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Return a deep copy to prevent mutation of cached data
    return Promise.resolve(JSON.parse(JSON.stringify(cached.response)));
  }

  try {
    const response = await api.get(url, config);
    cache.set(key, { timestamp: Date.now(), response });
    return response;
  } catch (error) {
    throw error;
  }
};

export const auth = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  signup: (data: any) => api.post('/auth/signup', data),
  getMe: () => cachedGet('/auth/me'),
  logout: () => {
    cache.clear();
    return api.post('/auth/logout');
  },
};

export const questions = {
  getAll: (params?: any) => cachedGet('/questions', { params }),
  getById: (id: string) => cachedGet(`/questions/${id}`),
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
  getById: (id: string) => cachedGet(`/users/${id}`),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getSpecialists: () => cachedGet('/users/specialists'),
  getAll: (params?: any) => cachedGet('/admin/users', { params }),
};

export const admin = {
  getStats: () => cachedGet('/admin/stats'),
  getReports: (status = 'pending', params?: any) => cachedGet('/moderation/reports', { params: { status, ...params } }),
  getBlockedWords: () => cachedGet('/moderation/blocked-words'),
  addBlockedWords: (words: string[]) => api.post('/moderation/blocked-words', { words }),
  removeBlockedWord: (word: string) => api.delete(`/moderation/blocked-words/${word}`),
  bulkCreateUsers: (users: any[]) => api.post('/auth/bulk-create', { users }),

  // New Moderation Endpoints
  takeAction: (data: any) => api.post('/moderation/action', data),
  getFlaggedContent: () => cachedGet('/moderation/flagged'),
  scanContent: (content: string) => api.post('/moderation/scan', { content }),
  removeItem: (type: string, id: string) => api.post(`/moderation/remove/${type}/${id}`),
  banUser: (userId: string) => api.post(`/moderation/ban/${userId}`),
  unbanUser: (userId: string) => api.post(`/moderation/unban/${userId}`),
  getSystemStats: () => cachedGet('/moderation/stats'),
  getLogs: () => cachedGet('/moderation/logs'),
  checkHealth: () => cachedGet('/health'),
  approveUser: (userId: string) => api.patch(`/admin/users/${userId}/approve`),
  bulkApproveUsers: (userIds: string[]) => api.post('/admin/users/bulk-approve', { userIds }),
};

export const tags = {
  getAll: () => cachedGet('/tags'),
};

export default api;
