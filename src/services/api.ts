import axios from 'axios';
import { User, Question, Answer, AuthResponse } from '../types';

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
  login: (credentials: { email: string; password: string }) => api.post<AuthResponse>('/auth/login', credentials),
  signup: (data: Partial<User> & { password: string }) => api.post<AuthResponse>('/auth/signup', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const questions = {
  getAll: (params?: Record<string, string | number>) => api.get<{ questions: Question[] }>('/questions', { params }),
  getById: (id: string) => api.get(`/questions/${id}`),
  create: (data: Partial<Question>) => api.post<Question>('/questions', data),
  update: (id: string, data: Partial<Question>) => api.put<Question>(`/questions/${id}`, data),
  delete: (id: string) => api.delete(`/questions/${id}`),
};

export const answers = {
  create: (questionId: string, data: { content: string }) => api.post<Answer>(`/answers/${questionId}`, data),
  upvote: (id: string) => api.post(`/answers/${id}/upvote`),
  markBest: (id: string) => api.post(`/answers/${id}/best`),
  checkUpvoted: (answerIds: string[]) => api.post(`/answers/check-upvotes`, { answerIds }),
};

export const users = {
  getById: (id: string) => api.get(`/users/${id}`),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/profile', data),
  getSpecialists: () => api.get<User[]>('/users/specialists'),
  getAll: (params?: Record<string, string | number>) => api.get<{ users: User[] }>('/users', { params }), // Optimistic
};

export const admin = {
  getStats: () => cachedGet('/admin/stats'),
  getReports: (status = 'pending', params?: any) => cachedGet('/moderation/reports', { params: { status, ...params } }),
  getBlockedWords: () => cachedGet('/moderation/blocked-words'),
  addBlockedWords: (words: string[]) => api.post('/moderation/blocked-words', { words }),
  removeBlockedWord: (word: string) => api.delete(`/moderation/blocked-words/${word}`),
  bulkCreateUsers: (users: Partial<User>[]) => api.post('/auth/bulk-create', { users }),

  // New Moderation Endpoints
  takeAction: (data: Record<string, unknown>) => api.post('/moderation/action', data),
  getFlaggedContent: () => api.get('/moderation/flagged'),
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
