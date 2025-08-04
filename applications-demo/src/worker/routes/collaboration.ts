import { Hono } from 'hono';

const app = new Hono();

// Get collaboration room state
app.get('/room/:roomId', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get Durable Object
    const id = c.env.COLLABORATION.idFromName(roomId);
    const obj = c.env.COLLABORATION.get(id);

    const response = await obj.fetch('http://localhost/state');
    
    if (!response.ok) {
      return c.json({ error: 'Failed to get room state' }, 500);
    }

    const state = await response.json();

    return c.json({
      success: true,
      data: state,
    });
  } catch (error) {
    console.error('Error getting room state:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get room participants
app.get('/room/:roomId/participants', async (c) => {
  try {
    const roomId = c.req.param('roomId');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get Durable Object
    const id = c.env.COLLABORATION.idFromName(roomId);
    const obj = c.env.COLLABORATION.get(id);

    const response = await obj.fetch('http://localhost/participants');
    
    if (!response.ok) {
      return c.json({ error: 'Failed to get participants' }, 500);
    }

    const participants = await response.json();

    return c.json({
      success: true,
      data: participants,
    });
  } catch (error) {
    console.error('Error getting participants:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Invite user to project
app.post('/invite', async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    const body = await c.req.json();
    const { projectId, inviteeEmail, permissions = 'read' } = body;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check project ownership
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND owner_id = ?
    `).bind(projectId, userId).first();

    if (!project) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Get invitee user
    const invitee = await c.env.DB.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(inviteeEmail).first();

    if (!invitee) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Check if already collaborator
    const existingCollaborator = await c.env.DB.prepare(`
      SELECT * FROM project_collaborators 
      WHERE project_id = ? AND user_id = ?
    `).bind(projectId, invitee.id).first();

    if (existingCollaborator) {
      return c.json({ error: 'User is already a collaborator' }, 409);
    }

    // Add collaborator
    await c.env.DB.prepare(`
      INSERT INTO project_collaborators (project_id, user_id, permissions, created_at)
      VALUES (?, ?, ?, ?)
    `).bind(projectId, invitee.id, permissions, new Date().toISOString()).run();

    return c.json({
      success: true,
      message: 'User invited successfully',
      data: {
        projectId,
        inviteeId: invitee.id,
        permissions,
      },
    });
  } catch (error) {
    console.error('Error inviting user:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Remove collaborator
app.delete('/collaborator/:projectId/:userId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const collaboratorId = c.req.param('userId');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check project ownership
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND owner_id = ?
    `).bind(projectId, userId).first();

    if (!project) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Remove collaborator
    await c.env.DB.prepare(`
      DELETE FROM project_collaborators 
      WHERE project_id = ? AND user_id = ?
    `).bind(projectId, collaboratorId).run();

    return c.json({
      success: true,
      message: 'Collaborator removed successfully',
    });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get project collaborators
app.get('/project/:projectId/collaborators', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check project access
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.owner_id !== userId) {
      const collaborator = await c.env.DB.prepare(`
        SELECT * FROM project_collaborators 
        WHERE project_id = ? AND user_id = ?
      `).bind(projectId, userId).first();

      if (!collaborator) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    // Get collaborators
    const { results: collaborators } = await c.env.DB.prepare(`
      SELECT pc.*, u.name, u.email, u.avatar
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = ?
      ORDER BY pc.created_at ASC
    `).bind(projectId).all();

    return c.json({
      success: true,
      data: collaborators,
    });
  } catch (error) {
    console.error('Error getting collaborators:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update collaborator permissions
app.put('/collaborator/:projectId/:userId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const collaboratorId = c.req.param('userId');
    const userId = c.req.header('X-User-ID');
    const body = await c.req.json();
    const { permissions } = body;

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check project ownership
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND owner_id = ?
    `).bind(projectId, userId).first();

    if (!project) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Update permissions
    await c.env.DB.prepare(`
      UPDATE project_collaborators 
      SET permissions = ?, updated_at = ?
      WHERE project_id = ? AND user_id = ?
    `).bind(permissions, new Date().toISOString(), projectId, collaboratorId).run();

    return c.json({
      success: true,
      message: 'Permissions updated successfully',
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get collaboration analytics
app.get('/analytics/:projectId', async (c) => {
  try {
    const projectId = c.req.param('projectId');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check project access
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    if (project.owner_id !== userId) {
      const collaborator = await c.env.DB.prepare(`
        SELECT * FROM project_collaborators 
        WHERE project_id = ? AND user_id = ?
      `).bind(projectId, userId).first();

      if (!collaborator) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    // Get collaboration metrics
    const { results: collaborators } = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_collaborators
      FROM project_collaborators 
      WHERE project_id = ?
    `).bind(projectId).all();

    const { results: fileUpdates } = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_updates
      FROM project_files 
      WHERE project_id = ? AND updated_at > datetime('now', '-7 days')
    `).bind(projectId).all();

    const analytics = {
      projectId,
      totalCollaborators: collaborators[0]?.total_collaborators || 0,
      recentUpdates: fileUpdates[0]?.total_updates || 0,
      lastActivity: project.updated_at,
      createdAt: project.created_at,
    };

    return c.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export const collaborationRoutes = app;
export default app; 