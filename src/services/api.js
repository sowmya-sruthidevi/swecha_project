import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (data) => api.post('/signup', data),
  login: (data) => api.post('/login', data),
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
};

export const groupApi = {
  createGroup: (data) => api.post('/groups', data),
  getGroups: (params) => api.get('/groups', { params }),
  getGroup: (id) => api.get(`/groups/${id}`),
  updateGroup: (id, data) => api.put(`/groups/${id}`, data),
  deleteGroup: (id) => api.delete(`/groups/${id}`),
  joinGroup: (id) => api.post(`/groups/${id}/join`),
  leaveGroup: (id) => api.post(`/groups/${id}/leave`),
  getDashboardStats: () => api.get('/groups/dashboard-stats'),
  getPublicStats: () => api.get('/groups/public-stats'),
  uploadResource: (id, formData) => api.post(`/groups/${id}/resources`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
};

export const chatbotApi = {
  sendMessage: (data) => api.post('/chatbot/chat', data),
  uploadPdf: (formData) => api.post('/chatbot/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSessions: (params) => api.get('/chatbot/sessions', { params }),
  getSessionMessages: (sessionId) => api.get(`/chatbot/sessions/${sessionId}/messages`),
  deleteSession: (sessionId) => api.delete(`/chatbot/sessions/${sessionId}`),
  clearAllHistory: () => api.delete('/chatbot/clear-all'),
};

export default api;
