import { Hono } from 'hono';
import { AnalyticsEvent, PerformanceMetrics } from '@/types';

const app = new Hono();

// Track analytics event
app.post('/track', async (c) => {
  try {
    const body = await c.req.json();
    const { type, userId, projectId, data } = body;

    if (!type || !userId) {
      return c.json({ error: 'Type and userId are required' }, 400);
    }

    const event: AnalyticsEvent = {
      type,
      userId,
      projectId,
      data: data || {},
      timestamp: new Date(),
    };

    // Store in Analytics Engine
    await c.env.ANALYTICS.writeDataPoint({
      blobs: [event.type, event.userId, event.projectId || ''],
      doubles: [event.timestamp.getTime()],
      indexes: ['event_type', 'user_id', 'project_id'],
    });

    // Also store in KV for quick access
    const key = `analytics:${event.timestamp.getTime()}:${event.type}`;
    await c.env.CACHE.put(key, JSON.stringify(event), {
      expirationTtl: 86400 * 7, // 7 days
    });

    return c.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking analytics:', error);
    return c.json({ error: 'Failed to track event' }, 500);
  }
});

// Get user analytics
app.get('/user/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    if (!userId) {
      return c.json({ error: 'User ID is required' }, 400);
    }

    // Get user analytics from D1
    const userStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT p.id) as totalProjects,
        COUNT(DISTINCT c.user_id) as activeUsers,
        COALESCE(SUM(s.duration), 0) as hoursCoded,
        AVG(p.performance_score) as performance
      FROM users u
      LEFT JOIN projects p ON u.id = p.owner_id
      LEFT JOIN collaborators c ON p.id = c.project_id
      LEFT JOIN sessions s ON u.id = s.user_id
      WHERE u.id = ?
    `).bind(userId).first();

    return c.json({
      success: true,
      data: {
        totalProjects: userStats?.totalProjects || 0,
        activeUsers: userStats?.activeUsers || 0,
        hoursCoded: Math.round((userStats?.hoursCoded || 0) / 3600), // Convert seconds to hours
        performance: Math.round(userStats?.performance || 0),
      }
    });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

// Get project analytics
app.get('/project/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const days = parseInt(c.req.query('days') || '7');

    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }

    // Get project analytics
    const query = `
      SELECT 
        type,
        user_id,
        COUNT(*) as count,
        MIN(_time) as first_seen,
        MAX(_time) as last_seen
      FROM codecollab_analytics
      WHERE project_id = ?
        AND _time > datetime('now', '-${days} days')
      GROUP BY type, user_id
      ORDER BY count DESC
    `;

    const { results } = await c.env.ANALYTICS.query(query, [projectId]);

    // Calculate project metrics
    const totalEvents = results.reduce((sum: number, row: any) => sum + row.count, 0);
    const uniqueUsers = [...new Set(results.map((row: any) => row.user_id))].length;
    const eventTypes = [...new Set(results.map((row: any) => row.type))];

    return c.json({
      success: true,
      data: {
        projectId,
        period: `${days} days`,
        totalEvents,
        uniqueUsers,
        eventTypes,
        events: results,
      },
    });
  } catch (error) {
    console.error('Error getting project analytics:', error);
    return c.json({ error: 'Failed to get analytics' }, 500);
  }
});

// Get performance metrics
app.get('/performance', async (c) => {
  try {
    // Get system performance metrics from D1
    const performance = await c.env.DB.prepare(`
      SELECT 
        AVG(cpu_usage) as cpuUsage,
        AVG(memory_usage) as memoryUsage,
        AVG(network_usage) as networkUsage,
        AVG(response_time) as responseTime
      FROM performance_metrics
      WHERE created_at >= datetime('now', '-1 hour')
    `).first();

    return c.json({
      success: true,
      data: {
        cpuUsage: Math.round(performance?.cpuUsage || 0),
        memoryUsage: Math.round(performance?.memoryUsage || 0),
        networkUsage: Math.round(performance?.networkUsage || 0),
        responseTime: Math.round(performance?.responseTime || 0),
      }
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return c.json({ error: 'Failed to get performance metrics' }, 500);
  }
});

// Get real-time activity
app.get('/realtime', async (c) => {
  try {
    // Get recent activity (last 5 minutes)
    const query = `
      SELECT 
        type,
        user_id,
        project_id,
        _time
      FROM codecollab_analytics
      WHERE _time > datetime('now', '-5 minutes')
      ORDER BY _time DESC
      LIMIT 50
    `;

    const { results } = await c.env.ANALYTICS.query(query);

    // Group by time intervals
    const activityByMinute: Record<string, number> = {};
    results.forEach((event: any) => {
      const minute = new Date(event._time).toISOString().slice(0, 16);
      activityByMinute[minute] = (activityByMinute[minute] || 0) + 1;
    });

    return c.json({
      success: true,
      data: {
        recentEvents: results,
        activityByMinute,
        totalRecentEvents: results.length,
      },
    });
  } catch (error) {
    console.error('Error getting real-time activity:', error);
    return c.json({ error: 'Failed to get real-time activity' }, 500);
  }
});

// Get collaboration metrics
app.get('/collaboration/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const days = parseInt(c.req.query('days') || '7');

    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }

    // Get collaboration-specific events
    const query = `
      SELECT 
        user_id,
        COUNT(*) as events,
        COUNT(CASE WHEN type = 'cursor_update' THEN 1 END) as cursor_updates,
        COUNT(CASE WHEN type = 'code_change' THEN 1 END) as code_changes,
        COUNT(CASE WHEN type = 'chat_message' THEN 1 END) as chat_messages,
        MIN(_time) as first_activity,
        MAX(_time) as last_activity
      FROM codecollab_analytics
      WHERE project_id = ?
        AND type IN ('cursor_update', 'code_change', 'chat_message', 'participant_joined', 'participant_left')
        AND _time > datetime('now', '-${days} days')
      GROUP BY user_id
      ORDER BY events DESC
    `;

    const { results } = await c.env.ANALYTICS.query(query, [projectId]);

    // Calculate collaboration metrics
    const totalParticipants = results.length;
    const totalEvents = results.reduce((sum: number, row: any) => sum + row.events, 0);
    const totalCursorUpdates = results.reduce((sum: number, row: any) => sum + row.cursor_updates, 0);
    const totalCodeChanges = results.reduce((sum: number, row: any) => sum + row.code_changes, 0);
    const totalChatMessages = results.reduce((sum: number, row: any) => sum + row.chat_messages, 0);

    return c.json({
      success: true,
      data: {
        projectId,
        period: `${days} days`,
        totalParticipants,
        totalEvents,
        totalCursorUpdates,
        totalCodeChanges,
        totalChatMessages,
        participants: results,
      },
    });
  } catch (error) {
    console.error('Error getting collaboration metrics:', error);
    return c.json({ error: 'Failed to get collaboration metrics' }, 500);
  }
});

// Export analytics data
app.get('/export/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const format = c.req.query('format') || 'json';
    const days = parseInt(c.req.query('days') || '30');

    if (!projectId) {
      return c.json({ error: 'Project ID is required' }, 400);
    }

    // Get all analytics data for the project
    const query = `
      SELECT *
      FROM codecollab_analytics
      WHERE project_id = ?
        AND _time > datetime('now', '-${days} days')
      ORDER BY _time DESC
    `;

    const { results } = await c.env.ANALYTICS.query(query, [projectId]);

    if (format === 'csv') {
      // Convert to CSV
      const csvHeaders = ['timestamp', 'type', 'user_id', 'project_id', 'data'];
      const csvRows = results.map((row: any) => [
        row._time,
        row.type,
        row.user_id,
        row.project_id,
        JSON.stringify(row.data || {}),
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${projectId}-${days}days.csv"`,
        },
      });
    }

    // Default JSON format
    return c.json({
      success: true,
      data: {
        projectId,
        period: `${days} days`,
        totalEvents: results.length,
        events: results,
      },
    });
  } catch (error) {
    console.error('Error exporting analytics:', error);
    return c.json({ error: 'Failed to export analytics' }, 500);
  }
});

export const analyticsRoutes = app;
export default app; 