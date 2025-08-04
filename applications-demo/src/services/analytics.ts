import { api } from './api';

export interface AnalyticsEvent {
  type: string;
  userId: string;
  projectId?: string;
  data?: any;
  timestamp: string;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  responseTime: number;
}

export interface UserStats {
  totalProjects: number;
  activeUsers: number;
  hoursCoded: number;
  performance: number;
}

export const analyticsService = {
  // Track user activity
  trackEvent: async (event: AnalyticsEvent) => {
    try {
      await api.post('/api/analytics/track', event);
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  },

  // Get user statistics
  getUserStats: async (userId: string): Promise<UserStats> => {
    try {
      const response = await api.get(`/api/analytics/user/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      return {
        totalProjects: 0,
        activeUsers: 0,
        hoursCoded: 0,
        performance: 0,
      };
    }
  },

  // Get project statistics
  getProjectStats: async (projectId: string) => {
    try {
      const response = await api.get(`/api/analytics/project/${projectId}`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to get project stats:', error);
      return null;
    }
  },

  // Get performance metrics
  getPerformanceMetrics: async (): Promise<PerformanceMetrics> => {
    try {
      const response = await api.get('/api/analytics/performance');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      return {
        cpuUsage: 0,
        memoryUsage: 0,
        networkUsage: 0,
        responseTime: 0,
      };
    }
  },

  // Get real-time activity
  getRealtimeActivity: async () => {
    try {
      const response = await api.get('/api/analytics/realtime');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get realtime activity:', error);
      return [];
    }
  },

  // Track coding session
  startCodingSession: async (projectId: string) => {
    try {
      await api.post('/api/analytics/session/start', { projectId });
    } catch (error) {
      console.error('Failed to start coding session:', error);
    }
  },

  // End coding session
  endCodingSession: async (projectId: string, duration: number) => {
    try {
      await api.post('/api/analytics/session/end', { projectId, duration });
    } catch (error) {
      console.error('Failed to end coding session:', error);
    }
  },

  // Track file changes
  trackFileChange: async (projectId: string, fileId: string, changes: any) => {
    try {
      await api.post('/api/analytics/file-change', {
        projectId,
        fileId,
        changes,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track file change:', error);
    }
  },

  // Track collaboration events
  trackCollaboration: async (projectId: string, eventType: string, data: any) => {
    try {
      await api.post('/api/analytics/collaboration', {
        projectId,
        eventType,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track collaboration:', error);
    }
  },
}; 