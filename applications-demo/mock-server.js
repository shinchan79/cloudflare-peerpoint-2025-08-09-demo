const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock data
const users = [
  { id: '1', name: 'Demo User', email: 'demo@codecollab.live', color: '#3b82f6', isOnline: true },
  { id: '2', name: 'Alice Developer', email: 'alice@codecollab.live', color: '#ef4444', isOnline: true },
  { id: '3', name: 'Bob Coder', email: 'bob@codecollab.live', color: '#10b981', isOnline: false }
];

const projects = [
  { id: '1', name: 'React Todo App', description: 'A modern todo application', language: 'TypeScript', collaborators: 3 },
  { id: '2', name: 'E-commerce Platform', description: 'Full-stack e-commerce solution', language: 'JavaScript', collaborators: 5 },
  { id: '3', name: 'AI Chat Bot', description: 'Intelligent chatbot powered by OpenAI', language: 'Python', collaborators: 2 }
];

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'demo@codecollab.live' && password === 'password') {
    res.json({
      success: true,
      data: {
        user: users[0],
        token: 'mock-token-' + Date.now()
      }
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

app.get('/api/auth/users', (req, res) => {
  res.json({ success: true, data: users });
});

// Projects routes
app.get('/api/projects', (req, res) => {
  res.json({ success: true, data: projects });
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find(p => p.id === req.params.id);
  if (project) {
    res.json({ success: true, data: project });
  } else {
    res.status(404).json({ success: false, error: 'Project not found' });
  }
});

// Analytics routes
app.get('/api/analytics/user/:userId', (req, res) => {
  res.json({
    success: true,
    data: {
      totalProjects: 12,
      activeUsers: 8,
      hoursCoded: 156,
      performance: 98
    }
  });
});

app.get('/api/analytics/performance', (req, res) => {
  res.json({
    success: true,
    data: {
      cpuUsage: 12,
      memoryUsage: 45,
      networkUsage: 78,
      responseTime: 45
    }
  });
});

// AI routes
app.post('/api/ai/completion', (req, res) => {
  res.json({
    success: true,
    data: {
      completion: '// AI suggested code completion\nconsole.log("Hello from AI!");'
    }
  });
});

app.post('/api/ai/errors', (req, res) => {
  res.json({
    success: true,
    data: [
      { message: 'Missing semicolon', line: 5, suggestion: 'Add semicolon at end of line' }
    ]
  });
});

app.post('/api/ai/explain', (req, res) => {
  res.json({
    success: true,
    data: {
      explanation: 'This code creates a function that processes user input and returns a formatted result.'
    }
  });
});

const PORT = 8787;
app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
}); 