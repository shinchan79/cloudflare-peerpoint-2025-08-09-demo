import axios from 'axios';

// Create axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8787',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-User-ID'] = JSON.parse(atob(token.split('.')[1])?.id || '');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    profile: '/api/auth/profile',
    users: '/api/auth/users',
  },
  
  // Projects
  projects: {
    list: '/api/projects',
    create: '/api/projects',
    get: (id: string) => `/api/projects/${id}`,
    update: (id: string) => `/api/projects/${id}`,
    delete: (id: string) => `/api/projects/${id}`,
    file: (projectId: string, fileId: string) => `/api/projects/${projectId}/files/${fileId}`,
  },
  
  // Collaboration
  collaboration: {
    room: (roomId: string) => `/api/collaboration/room/${roomId}`,
    participants: (roomId: string) => `/api/collaboration/room/${roomId}/participants`,
    invite: '/api/collaboration/invite',
    removeCollaborator: (projectId: string, userId: string) => `/api/collaboration/collaborator/${projectId}/${userId}`,
    collaborators: (projectId: string) => `/api/collaboration/project/${projectId}/collaborators`,
    updatePermissions: (projectId: string, userId: string) => `/api/collaboration/collaborator/${projectId}/${userId}`,
    analytics: (projectId: string) => `/api/collaboration/analytics/${projectId}`,
  },
  
  // AI
  ai: {
    completion: '/api/ai/completion',
    errors: '/api/ai/errors',
    chat: '/api/ai/chat',
    explain: '/api/ai/explain',
    optimize: '/api/ai/optimize',
  },
  
  // Deployments
  deployments: {
    create: '/api/deployments',
    list: (projectId: string) => `/api/deployments/project/${projectId}`,
    get: (id: string) => `/api/deployments/${id}`,
    cancel: (id: string) => `/api/deployments/${id}`,
    redeploy: (id: string) => `/api/deployments/${id}/redeploy`,
  },
  
  // Analytics
  analytics: {
    track: '/api/analytics/track',
    user: (userId: string) => `/api/analytics/user/${userId}`,
    project: (projectId: string) => `/api/analytics/project/${projectId}`,
    performance: '/api/analytics/performance',
    realtime: '/api/analytics/realtime',
    collaboration: (projectId: string) => `/api/analytics/collaboration/${projectId}`,
    export: (projectId: string) => `/api/analytics/export/${projectId}`,
  },
  
  // WebSocket
  websocket: (roomId: string, userId: string, userName: string, userColor: string) => 
    `ws://localhost:8787/ws/${roomId}?userId=${userId}&userName=${userName}&userColor=${userColor}`,
};

// Helper functions
export const apiHelpers = {
  // Track analytics event
  trackEvent: async (type: string, data?: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const user = JSON.parse(atob(token.split('.')[1]));
        await api.post(endpoints.analytics.track, {
          type,
          userId: user.id,
          data,
        });
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  },
  
  // Upload file to R2
  uploadFile: async (file: File, projectId: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  },
  
  // Get file from R2
  getFile: async (fileId: string) => {
    try {
      const response = await api.get(`/api/files/${fileId}`, {
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      console.error('File download failed:', error);
      throw error;
    }
  },
  
  // Create WebSocket connection
  createWebSocket: (roomId: string, userId: string, userName: string, userColor: string) => {
    const wsUrl = endpoints.websocket(roomId, userId, userName, userColor);
    return new WebSocket(wsUrl);
  },
};

export default api; 