-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    color TEXT DEFAULT '#3b82f6',
    is_online BOOLEAN DEFAULT false,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    domain TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Project collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    permissions TEXT DEFAULT 'read',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(project_id, user_id)
);

-- Project files table
CREATE TABLE IF NOT EXISTS project_files (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    content TEXT,
    language TEXT,
    type TEXT DEFAULT 'file',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Deployments table
CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    url TEXT,
    custom_domain TEXT,
    build_logs TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    user_id TEXT,
    project_id TEXT,
    data TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI chat history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    project_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    code_blocks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT,
    region TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_files_project ON project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_files_path ON project_files(path);
CREATE INDEX IF NOT EXISTS idx_deployments_project ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_project ON analytics_events(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_chat_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_timestamp ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_performance_project ON performance_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_performance_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);

-- Insert default data
INSERT OR IGNORE INTO users (id, name, email, color) VALUES 
('1', 'Demo User', 'demo@codecollab.live', '#3b82f6'),
('2', 'Alice Developer', 'alice@codecollab.live', '#ef4444'),
('3', 'Bob Coder', 'bob@codecollab.live', '#10b981');

-- Insert sample project
INSERT OR IGNORE INTO projects (id, name, description, owner_id, is_public) VALUES 
('demo-project', 'Welcome to CodeCollab Live', 'A sample project to get you started with real-time collaboration', '1', true);

-- Insert sample files
INSERT OR IGNORE INTO project_files (id, project_id, name, path, content, language) VALUES 
('file-1', 'demo-project', 'index.html', '/index.html', '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CodeCollab Live!</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="app">
        <h1>🚀 Welcome to CodeCollab Live!</h1>
        <p>Start coding with your team in real-time.</p>
        <div id="counter">0</div>
        <button onclick="increment()">Increment</button>
    </div>
    <script src="script.js"></script>
</body>
</html>', 'html'),

('file-2', 'demo-project', 'style.css', '/style.css', 'body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
    margin-bottom: 20px;
}

#counter {
    font-size: 48px;
    font-weight: bold;
    color: #3b82f6;
    margin: 20px 0;
}

button {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: background 0.2s;
}

button:hover {
    background: #2563eb;
}', 'css'),

('file-3', 'demo-project', 'script.js', '/script.js', '// Welcome to CodeCollab Live!
console.log("Hello from CodeCollab Live!");

let counter = 0;

function increment() {
    counter++;
    document.getElementById("counter").textContent = counter;
    
    // Send to other participants
    if (window.collaboration) {
        window.collaboration.send({
            type: "counter_update",
            value: counter
        });
    }
}

// Listen for updates from other participants
if (window.collaboration) {
    window.collaboration.on("counter_update", (data) => {
        counter = data.value;
        document.getElementById("counter").textContent = counter;
    });
}

// Add some interactive features
document.addEventListener("DOMContentLoaded", () => {
    console.log("App loaded successfully!");
    
    // Add keyboard shortcut
    document.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "Enter") {
            increment();
        }
    });
});', 'javascript'); 