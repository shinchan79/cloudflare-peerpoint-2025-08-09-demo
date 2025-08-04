import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { analyticsService } from '../services/analytics';

export const useAnalytics = () => {
  const { currentUser } = useAppStore();
  const sessionStartTime = useRef<number>(Date.now());
  const currentProjectId = useRef<string | null>(null);

  // Track page views
  const trackPageView = (page: string) => {
    if (currentUser) {
      analyticsService.trackEvent({
        type: 'page_view',
        userId: currentUser.id,
        data: { page },
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Track project session
  const startProjectSession = (projectId: string) => {
    if (currentUser) {
      currentProjectId.current = projectId;
      analyticsService.startCodingSession(projectId);
      analyticsService.trackEvent({
        type: 'session_start',
        userId: currentUser.id,
        projectId,
        data: { timestamp: Date.now() },
        timestamp: new Date().toISOString(),
      });
    }
  };

  // End project session
  const endProjectSession = () => {
    if (currentUser && currentProjectId.current) {
      const duration = Date.now() - sessionStartTime.current;
      analyticsService.endCodingSession(currentProjectId.current, duration);
      analyticsService.trackEvent({
        type: 'session_end',
        userId: currentUser.id,
        projectId: currentProjectId.current,
        data: { duration },
        timestamp: new Date().toISOString(),
      });
      currentProjectId.current = null;
    }
  };

  // Track file changes
  const trackFileChange = (fileId: string, changes: any) => {
    if (currentUser && currentProjectId.current) {
      analyticsService.trackFileChange(currentProjectId.current, fileId, changes);
      analyticsService.trackEvent({
        type: 'file_change',
        userId: currentUser.id,
        projectId: currentProjectId.current,
        data: { fileId, changes },
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Track collaboration events
  const trackCollaboration = (eventType: string, data: any) => {
    if (currentUser && currentProjectId.current) {
      analyticsService.trackCollaboration(currentProjectId.current, eventType, data);
      analyticsService.trackEvent({
        type: eventType,
        userId: currentUser.id,
        projectId: currentProjectId.current,
        data,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Track user activity
  const trackUserActivity = (activity: string, data?: any) => {
    if (currentUser) {
      analyticsService.trackEvent({
        type: 'user_activity',
        userId: currentUser.id,
        projectId: currentProjectId.current,
        data: { activity, ...data },
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Auto-track user activity
  useEffect(() => {
    if (!currentUser) return;

    // Track initial page view
    trackPageView(window.location.pathname);

    // Track user activity every 5 minutes
    const activityInterval = setInterval(() => {
      trackUserActivity('active_session');
    }, 5 * 60 * 1000);

    // Track before unload
    const handleBeforeUnload = () => {
      endProjectSession();
      trackUserActivity('session_end');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(activityInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endProjectSession();
    };
  }, [currentUser]);

  return {
    trackPageView,
    startProjectSession,
    endProjectSession,
    trackFileChange,
    trackCollaboration,
    trackUserActivity,
  };
}; 