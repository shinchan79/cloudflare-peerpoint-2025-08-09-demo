import { Hono } from 'hono';
import { Project, FileStructure } from '@/types';

const app = new Hono();

// Get all projects for user
app.get('/', async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM projects 
      WHERE owner_id = ? OR id IN (
        SELECT project_id FROM project_collaborators WHERE user_id = ?
      )
      ORDER BY updated_at DESC
    `).bind(userId, userId).all();

    return c.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get single project
app.get('/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // Check permissions
    if (project.owner_id !== userId) {
      const collaborator = await c.env.DB.prepare(`
        SELECT * FROM project_collaborators 
        WHERE project_id = ? AND user_id = ?
      `).bind(projectId, userId).first();

      if (!collaborator) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    // Get project files
    const { results: files } = await c.env.DB.prepare(`
      SELECT * FROM project_files WHERE project_id = ? ORDER BY path
    `).bind(projectId).all();

    return c.json({
      success: true,
      data: {
        ...project,
        files: files,
      },
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create new project
app.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { name, description, isPublic = false } = body;

    if (!name) {
      return c.json({ error: 'Project name is required' }, 400);
    }

    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create project
    await c.env.DB.prepare(`
      INSERT INTO projects (id, name, description, owner_id, is_public, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(projectId, name, description, userId, isPublic, now, now).run();

    // Create default files
    const defaultFiles = [
      {
        id: crypto.randomUUID(),
        name: 'index.html',
        path: '/index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <h1>Welcome to ${name}!</h1>
        <p>Start coding with your team in real-time.</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
        language: 'html',
      },
      {
        id: crypto.randomUUID(),
        name: 'style.css',
        path: '/style.css',
        content: `body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

#app {
    background: white;
    padding: 40px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    text-align: center;
}

h1 {
    color: #333;
    margin-bottom: 10px;
}

p {
    color: #666;
    margin: 0;
}`,
        language: 'css',
      },
      {
        id: crypto.randomUUID(),
        name: 'script.js',
        path: '/script.js',
        content: `// Your JavaScript code here
console.log('Hello from ${name}!');

// Add your interactive features here
document.addEventListener('DOMContentLoaded', () => {
    console.log('App loaded successfully!');
});`,
        language: 'javascript',
      },
    ];

    for (const file of defaultFiles) {
      await c.env.DB.prepare(`
        INSERT INTO project_files (id, project_id, name, path, content, language, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(file.id, projectId, file.name, file.path, file.content, file.language, now).run();
    }

    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first();

    return c.json({
      success: true,
      data: {
        ...project,
        files: defaultFiles,
      },
    }, 201);
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update project
app.put('/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const userId = c.req.header('X-User-ID');
    const body = await c.req.json();

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check ownership
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND owner_id = ?
    `).bind(projectId, userId).first();

    if (!project) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    const { name, description, isPublic } = body;
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE projects 
      SET name = ?, description = ?, is_public = ?, updated_at = ?
      WHERE id = ?
    `).bind(name, description, isPublic, now, projectId).run();

    const updatedProject = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first();

    return c.json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete project
app.delete('/:id', async (c) => {
  try {
    const projectId = c.req.param('id');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check ownership
    const project = await c.env.DB.prepare(`
      SELECT * FROM projects WHERE id = ? AND owner_id = ?
    `).bind(projectId, userId).first();

    if (!project) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Delete project files
    await c.env.DB.prepare(`
      DELETE FROM project_files WHERE project_id = ?
    `).bind(projectId).run();

    // Delete collaborators
    await c.env.DB.prepare(`
      DELETE FROM project_collaborators WHERE project_id = ?
    `).bind(projectId).run();

    // Delete project
    await c.env.DB.prepare(`
      DELETE FROM projects WHERE id = ?
    `).bind(projectId).run();

    return c.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get project file
app.get('/:id/files/:fileId', async (c) => {
  try {
    const projectId = c.req.param('id');
    const fileId = c.req.param('fileId');
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

    const file = await c.env.DB.prepare(`
      SELECT * FROM project_files WHERE id = ? AND project_id = ?
    `).bind(fileId, projectId).first();

    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    return c.json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update project file
app.put('/:id/files/:fileId', async (c) => {
  try {
    const projectId = c.req.param('id');
    const fileId = c.req.param('fileId');
    const userId = c.req.header('X-User-ID');
    const body = await c.req.json();

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

    const { content } = body;
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      UPDATE project_files 
      SET content = ?, updated_at = ?
      WHERE id = ? AND project_id = ?
    `).bind(content, now, fileId, projectId).run();

    // Update project timestamp
    await c.env.DB.prepare(`
      UPDATE projects SET updated_at = ? WHERE id = ?
    `).bind(now, projectId).run();

    const file = await c.env.DB.prepare(`
      SELECT * FROM project_files WHERE id = ? AND project_id = ?
    `).bind(fileId, projectId).first();

    return c.json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error('Error updating file:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export const projectRoutes = app;
export default app; 