import { Hono } from 'hono';
import { Deployment } from '@/types';

const app = new Hono();

// Create deployment
app.post('/', async (c) => {
  try {
    const userId = c.req.header('X-User-ID');
    const body = await c.req.json();
    const { projectId, customDomain } = body;

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

    // Get project files
    const { results: files } = await c.env.DB.prepare(`
      SELECT * FROM project_files WHERE project_id = ? ORDER BY path
    `).bind(projectId).all();

    const deploymentId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create deployment record
    await c.env.DB.prepare(`
      INSERT INTO deployments (id, project_id, status, custom_domain, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(deploymentId, projectId, 'pending', customDomain, now).run();

    // Simulate build process
    setTimeout(async () => {
      try {
        // Update status to building
        await c.env.DB.prepare(`
          UPDATE deployments SET status = ? WHERE id = ?
        `).bind('building', deploymentId).run();

        // Build the project (simplified)
        const buildResult = await buildProject(files, c.env.ASSETS);
        
        if (buildResult.success) {
          // Update status to deployed
          await c.env.DB.prepare(`
            UPDATE deployments 
            SET status = ?, url = ?, build_logs = ?
            WHERE id = ?
          `).bind('deployed', buildResult.url, buildResult.logs, deploymentId).run();
        } else {
          // Update status to failed
          await c.env.DB.prepare(`
            UPDATE deployments 
            SET status = ?, build_logs = ?
            WHERE id = ?
          `).bind('failed', buildResult.logs, deploymentId).run();
        }
      } catch (error) {
        console.error('Build error:', error);
        await c.env.DB.prepare(`
          UPDATE deployments 
          SET status = ?, build_logs = ?
          WHERE id = ?
        `).bind('failed', 'Build failed', deploymentId).run();
      }
    }, 1000);

    return c.json({
      success: true,
      data: {
        id: deploymentId,
        projectId,
        status: 'pending',
        customDomain,
        createdAt: now,
      } as Deployment,
    }, 201);
  } catch (error) {
    console.error('Error creating deployment:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get project deployments
app.get('/project/:projectId', async (c) => {
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

    // Get deployments
    const { results: deployments } = await c.env.DB.prepare(`
      SELECT * FROM deployments 
      WHERE project_id = ? 
      ORDER BY created_at DESC
    `).bind(projectId).all();

    return c.json({
      success: true,
      data: deployments,
    });
  } catch (error) {
    console.error('Error getting deployments:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get deployment details
app.get('/:id', async (c) => {
  try {
    const deploymentId = c.req.param('id');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const deployment = await c.env.DB.prepare(`
      SELECT d.*, p.name as project_name, p.owner_id
      FROM deployments d
      JOIN projects p ON d.project_id = p.id
      WHERE d.id = ?
    `).bind(deploymentId).first();

    if (!deployment) {
      return c.json({ error: 'Deployment not found' }, 404);
    }

    if (deployment.owner_id !== userId) {
      const collaborator = await c.env.DB.prepare(`
        SELECT * FROM project_collaborators 
        WHERE project_id = ? AND user_id = ?
      `).bind(deployment.project_id, userId).first();

      if (!collaborator) {
        return c.json({ error: 'Access denied' }, 403);
      }
    }

    return c.json({
      success: true,
      data: deployment,
    });
  } catch (error) {
    console.error('Error getting deployment:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Cancel deployment
app.delete('/:id', async (c) => {
  try {
    const deploymentId = c.req.param('id');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const deployment = await c.env.DB.prepare(`
      SELECT d.*, p.owner_id
      FROM deployments d
      JOIN projects p ON d.project_id = p.id
      WHERE d.id = ?
    `).bind(deploymentId).first();

    if (!deployment) {
      return c.json({ error: 'Deployment not found' }, 404);
    }

    if (deployment.owner_id !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Only allow cancellation of pending or building deployments
    if (!['pending', 'building'].includes(deployment.status)) {
      return c.json({ error: 'Cannot cancel completed deployment' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE deployments 
      SET status = ?, build_logs = ?
      WHERE id = ?
    `).bind('cancelled', 'Deployment cancelled by user', deploymentId).run();

    return c.json({
      success: true,
      message: 'Deployment cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling deployment:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Redeploy
app.post('/:id/redeploy', async (c) => {
  try {
    const deploymentId = c.req.param('id');
    const userId = c.req.header('X-User-ID');

    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const deployment = await c.env.DB.prepare(`
      SELECT d.*, p.owner_id
      FROM deployments d
      JOIN projects p ON d.project_id = p.id
      WHERE d.id = ?
    `).bind(deploymentId).first();

    if (!deployment) {
      return c.json({ error: 'Deployment not found' }, 404);
    }

    if (deployment.owner_id !== userId) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Create new deployment
    const newDeploymentId = crypto.randomUUID();
    const now = new Date().toISOString();

    await c.env.DB.prepare(`
      INSERT INTO deployments (id, project_id, status, custom_domain, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(newDeploymentId, deployment.project_id, 'pending', deployment.custom_domain, now).run();

    return c.json({
      success: true,
      data: {
        id: newDeploymentId,
        projectId: deployment.project_id,
        status: 'pending',
        customDomain: deployment.custom_domain,
        createdAt: now,
      } as Deployment,
    }, 201);
  } catch (error) {
    console.error('Error redeploying:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Helper function to build project
async function buildProject(files: any[], assets: any) {
  try {
    // Simulate build process
    const buildLogs: string[] = [];
    
    buildLogs.push('Starting build...');
    buildLogs.push('Processing files...');

    // Upload files to R2
    for (const file of files) {
      await assets.put(`builds/${file.id}/${file.name}`, file.content, {
        httpMetadata: {
          contentType: getContentType(file.name),
        },
      });
      buildLogs.push(`Uploaded ${file.name}`);
    }

    buildLogs.push('Build completed successfully');

    const url = `https://demo-${crypto.randomUUID()}.pages.dev`;

    return {
      success: true,
      url,
      logs: buildLogs.join('\n'),
    };
  } catch (error) {
    return {
      success: false,
      logs: `Build failed: ${error.message}`,
    };
  }
}

// Helper function to get content type
function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'js':
      return 'application/javascript';
    case 'json':
      return 'application/json';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'text/plain';
  }
}

export const deploymentRoutes = app;
export default app; 