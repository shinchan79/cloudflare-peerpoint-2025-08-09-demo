import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { authRoutes } from './routes/auth';
import { projectRoutes } from './routes/projects';
import { collaborationRoutes } from './routes/collaboration';
import { aiRoutes } from './routes/ai';
import { deploymentRoutes } from './routes/deployments';
import { analyticsRoutes } from './routes/analytics';
import { CollaborationRoom } from './durable-objects/collaboration-room';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://codecollab-live.pages.dev'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'CodeCollab Live API',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/collaboration', collaborationRoutes);
app.route('/api/ai', aiRoutes);
app.route('/api/deployments', deploymentRoutes);
app.route('/api/analytics', analyticsRoutes);

// WebSocket upgrade handler - disabled for local development
// app.get('/ws/:roomId', async (c) => {
//   const roomId = c.req.param('roomId');
//   const upgradeHeader = c.req.header('Upgrade');
//   
//   if (upgradeHeader !== 'websocket') {
//     return c.text('Expected websocket', 426);
//   }

//   const url = new URL(c.req.url);
//   const userId = url.searchParams.get('userId');
//   const userName = url.searchParams.get('userName');
//   const userColor = url.searchParams.get('userColor') || '#3b82f6';

//   if (!userId || !userName) {
//     return c.text('Missing userId or userName', 400);
//   }

//   // Get Durable Object
//   const id = c.env.COLLABORATION.idFromName(roomId);
//   const obj = c.env.COLLABORATION.get(id);

//   // Upgrade to WebSocket
//   const webSocketPair = new WebSocketPair();
//   const [client, server] = Object.values(webSocketPair);

//   server.accept();

//   // Send to Durable Object
//   obj.fetch('http://localhost/ws', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       userId,
//       userName,
//       userColor,
//       webSocket: server,
//     }),
//   });

//   return new Response(null, {
//     status: 101,
//     webSocket: client,
//   });
// });

// Error handling
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  }, 404);
});

export default app;

// Durable Objects - disabled for local development
// export { CollaborationRoom }; 