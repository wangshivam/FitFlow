import api from './client';

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  me: () => api.get('/auth/me'),
  refresh: (data) => api.post('/auth/refresh', data),
};

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  onboarding: (data) => api.post('/profile/onboarding', data),
};

export const foodAPI = {
  parse: (data) => api.post('/food/parse', data),
  log: (data) => api.post('/food/log', data),
  getLogs: (date) => api.get(`/food/logs/${date}`),
  updateLog: (id, data) => api.put(`/food/log/${id}`, data),
  deleteLog: (id) => api.delete(`/food/log/${id}`),
  getSummary: (date) => api.get(`/food/summary/${date}`),
  getHistory: (params) => api.get('/food/history', { params }),
  getFrequentMeals: () => api.get('/food/frequent'),
  getStreak: () => api.get('/food/streak'),
  quickLog: (data) => api.post('/food/quick-log', data),
  search: (params) => api.get('/food/search', { params }),
  match: (params) => api.get('/food/match', { params }),
  calculate: (data) => api.post('/food/calculate', data),
};

export const plannerAPI = {
  getToday: () => api.get('/planner/today'),
  getWeek: (date) => api.get(`/planner/week/${date}`),
  getDate: (date) => api.get(`/planner/date/${date}`),
  feedback: (data) => api.post('/planner/feedback', data),
  complete: (id, data) => api.put(`/planner/${id}/complete`, data),
  updateExercises: (id, data) => api.put(`/planner/${id}/exercises`, data),
  getHistory: (params) => api.get('/planner/history', { params }),
  regenerate: (checkinData) => api.post('/planner/regenerate', checkinData),
};

export const coachAPI = {
  sendMessage: (data) => api.post('/coach/message', data),
  getConversations: () => api.get('/coach/conversations'),
  getConversation: (id) => api.get(`/coach/conversation/${id}`),
  createConversation: () => api.post('/coach/conversation'),
  deleteConversation: (id) => api.delete(`/coach/conversation/${id}`),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
  getWeekly: () => api.get('/dashboard/weekly'),
  getNutritionAnalytics: (params) => api.get('/analytics/nutrition', { params }),
  getWorkoutAnalytics: (params) => api.get('/analytics/workout', { params }),
};

export const paymentAPI = {
  createSubscription: () => api.post('/payment/create-order'),
  verify: (data) => api.post('/payment/verify', data),
  getStatus: () => api.get('/payment/status'),
};

export const weeklySummaryAPI = {
  getWeek: (offset) => api.get(`/weekly-summary/${offset}`),
  logWeight: (data) => api.post('/weekly-summary/weight-log', data),
  getWeightLogs: (params) => api.get('/weekly-summary/weight-log', { params }),
};
