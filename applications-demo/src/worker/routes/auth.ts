import { Hono } from 'hono';
import { User } from '@/types';

const app = new Hono();

// Mock user data - in production, use proper authentication
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@codecollab.live',
    color: '#3b82f6',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: '2',
    name: 'Alice Developer',
    email: 'alice@codecollab.live',
    color: '#ef4444',
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: '3',
    name: 'Bob Coder',
    email: 'bob@codecollab.live',
    color: '#10b981',
    isOnline: false,
    lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
  },
];

// Login
app.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    // Mock authentication - in production, verify credentials
    const user = mockUsers.find(u => u.email === email);
    
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate session token
    const token = crypto.randomUUID();
    
    // Store in KV for session management
    await c.env.CACHE.put(`session:${token}`, JSON.stringify(user), {
      expirationTtl: 86400, // 24 hours
    });

    return c.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Register
app.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return c.json({ error: 'All fields are required' }, 400);
    }

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email);
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 409);
    }

    // Create new user
    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`, // Random color
      isOnline: true,
      lastSeen: new Date(),
    };

    mockUsers.push(newUser);

    // Generate session token
    const token = crypto.randomUUID();
    
    await c.env.CACHE.put(`session:${token}`, JSON.stringify(newUser), {
      expirationTtl: 86400,
    });

    return c.json({
      success: true,
      data: {
        user: newUser,
        token,
      },
    }, 201);
  } catch (error) {
    console.error('Error during registration:', error);
    return c.json({ error: 'Registration failed' }, 500);
  }
});

// Get current user
app.get('/me', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const userData = await c.env.CACHE.get(`session:${token}`);
    
    if (!userData) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const user: User = JSON.parse(userData);
    
    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return c.json({ error: 'Failed to get user' }, 500);
  }
});

// Logout
app.post('/logout', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      await c.env.CACHE.delete(`session:${token}`);
    }

    return c.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// Update user profile
app.put('/profile', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const userData = await c.env.CACHE.get(`session:${token}`);
    
    if (!userData) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const user: User = JSON.parse(userData);
    const body = await c.req.json();
    const { name, color } = body;

    // Update user
    const updatedUser: User = {
      ...user,
      name: name || user.name,
      color: color || user.color,
    };

    // Update in mock data
    const userIndex = mockUsers.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      mockUsers[userIndex] = updatedUser;
    }

    // Update session
    await c.env.CACHE.put(`session:${token}`, JSON.stringify(updatedUser), {
      expirationTtl: 86400,
    });

    return c.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Get all users (for collaboration)
app.get('/users', async (c) => {
  try {
    return c.json({
      success: true,
      data: mockUsers,
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

export const authRoutes = app;
export default app; 