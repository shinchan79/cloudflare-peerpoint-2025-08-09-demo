import { Poll } from './poll.js';

export { Poll };

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Serve static files
    if (path === "/" || path === "/index.html") {
      return serveStaticFile("/public/index.html", env);
    }
    
    if (path.startsWith("/public/")) {
      return serveStaticFile(path, env);
    }

    // API endpoints
    if (path.startsWith("/api/")) {
      return handleAPI(request, env, path);
    }

    // WebSocket connections for real-time updates
    if (path.startsWith("/ws/")) {
      return handleWebSocket(request, env, path);
    }

    return new Response("Not found", { status: 404 });
  }
};

async function handleAPI(request, env, path) {
  const url = new URL(request.url);
  const pollId = url.searchParams.get("pollId");

  if (!pollId) {
    return new Response(JSON.stringify({ error: "Poll ID required" }), {
      status: 400,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  const pollIdObj = env.POLL.idFromName(pollId);
  const pollObj = env.POLL.get(pollIdObj);

  switch (path) {
    case "/api/create":
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      
      const createData = await request.json();
      createData.id = pollId;
      
      // Store poll metadata in KV
      await env.POLLS_KV.put(pollId, JSON.stringify({
        question: createData.question,
        options: createData.options,
        created: Date.now()
      }));

      return pollObj.fetch(new Request(`${url.origin}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData)
      }));

    case "/api/vote":
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      
      return pollObj.fetch(new Request(`${url.origin}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(await request.json())
      }));

    case "/api/get":
      return pollObj.fetch(new Request(`${url.origin}/get`));

    default:
      return new Response("Not found", { status: 404 });
  }
}

async function handleWebSocket(request, env, path) {
  const pollId = path.replace("/ws/", "");
  
  if (!pollId) {
    return new Response("Poll ID required", { status: 400 });
  }

  const pollIdObj = env.POLL.idFromName(pollId);
  const pollObj = env.POLL.get(pollIdObj);

  return pollObj.fetch(request);
}

async function serveStaticFile(path, env) {
  // Serve static files from public directory
  const filePath = path.replace('/public/', '');
  
  // Define static files
  const staticFiles = {
    'index.html': {
      content: await getIndexHTML(),
      type: 'text/html'
    },
    'styles.css': {
      content: await getStylesCSS(),
      type: 'text/css'
    },
    'app.js': {
      content: await getAppJS(),
      type: 'application/javascript'
    }
  };
  
  const file = staticFiles[filePath];
  if (file) {
    return new Response(file.content, {
      headers: { 
        "Content-Type": file.type,
        "Cache-Control": "public, max-age=3600"
      }
    });
  }

  return new Response("File not found", { status: 404 });
}

async function getIndexHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗳️ Real-time Polling App</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗳️ Real-time Polling</h1>
            <p>Create and vote on polls with live updates and beautiful charts!</p>
        </div>

        <div class="content">
            <!-- Create Poll Form -->
            <div id="createForm">
                <h2>Create a New Poll</h2>
                <form id="pollForm">
                    <div class="form-group">
                        <label for="question">Question:</label>
                        <textarea id="question" rows="3" placeholder="What would you like to ask?" required></textarea>
                    </div>

                    <div class="form-group">
                        <label>Options:</label>
                        <div id="optionsContainer">
                            <input type="text" class="option-input" placeholder="Option 1" required>
                            <input type="text" class="option-input" placeholder="Option 2" required>
                        </div>
                        <button type="button" class="btn btn-secondary" onclick="addOption()" style="margin-top: 10px;">+ Add Option</button>
                    </div>

                    <button type="submit" class="btn">Create Poll</button>
                </form>
            </div>

            <!-- Poll Display -->
            <div id="pollDisplay" class="hidden">
                <div class="poll-display">
                    <div class="poll-question" id="pollQuestion"></div>
                    
                    <!-- Voting Section -->
                    <div class="voting-section">
                        <h3>Cast Your Vote</h3>
                        <div id="pollOptions"></div>
                    </div>

                    <!-- Statistics Section -->
                    <div class="stats-section">
                        <h3>Live Statistics</h3>
                        <div class="stats-grid">
                            <div class="stats-card">
                                <div class="stats-number" id="totalVotes">0</div>
                                <div class="stats-label">Total Votes</div>
                            </div>
                            <div class="stats-card">
                                <div class="stats-number" id="activeUsers">0</div>
                                <div class="stats-label">Active Users</div>
                            </div>
                        </div>
                    </div>

                    <!-- Chart Section -->
                    <div class="chart-section">
                        <h3>Results Visualization</h3>
                        <div class="chart-container">
                            <canvas id="resultsChart"></canvas>
                        </div>
                    </div>

                    <!-- Share Section -->
                    <div class="share-section">
                        <h3>Share This Poll</h3>
                        <div class="share-buttons">
                            <button class="btn btn-share" onclick="copyPollLink()">
                                📋 Copy Link
                            </button>
                            <button class="btn btn-share" onclick="shareOnTwitter()">
                                🐦 Share on Twitter
                            </button>
                        </div>
                        <div class="poll-link" id="pollLink"></div>
                    </div>
                </div>
                
                <button class="btn btn-secondary" onclick="showCreateForm()" style="margin-top: 20px;">Create Another Poll</button>
            </div>

            <div id="loading" class="loading hidden">
                <div class="spinner"></div>
                <p>Loading poll...</p>
            </div>

            <div id="error" class="error hidden"></div>
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>`;
}

async function getStylesCSS() {
  return `/* Reset and Base Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
    line-height: 1.6;
}

/* Container */
.container {
    max-width: 1000px;
    margin: 0 auto;
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    overflow: hidden;
    animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Header */
.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 40px;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    animation: rotate 20s linear infinite;
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.header h1 {
    font-size: 3em;
    margin-bottom: 15px;
    position: relative;
    z-index: 1;
}

.header p {
    font-size: 1.2em;
    opacity: 0.9;
    position: relative;
    z-index: 1;
}

/* Content */
.content {
    padding: 40px;
}

/* Form Styles */
.form-group {
    margin-bottom: 25px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
    font-size: 1.1em;
}

input, textarea {
    width: 100%;
    padding: 15px;
    border: 2px solid #e1e5e9;
    border-radius: 10px;
    font-size: 16px;
    transition: all 0.3s ease;
    background: #f8f9fa;
}

input:focus, textarea:focus {
    outline: none;
    border-color: #667eea;
    background: white;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.options-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
}

.option-input {
    min-width: 200px;
}

/* Buttons */
.btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    display: inline-block;
    text-align: center;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn:active {
    transform: translateY(0);
}

.btn-secondary {
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
}

.btn-share {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    margin: 5px;
    padding: 10px 20px;
    font-size: 14px;
}

/* Poll Display */
.poll-display {
    margin-top: 30px;
}

.poll-question {
    font-size: 2em;
    margin-bottom: 30px;
    color: #333;
    text-align: center;
    font-weight: 700;
}

/* Voting Section */
.voting-section {
    margin-bottom: 40px;
    padding: 30px;
    background: #f8f9fa;
    border-radius: 15px;
}

.voting-section h3 {
    margin-bottom: 20px;
    color: #333;
    font-size: 1.5em;
}

.option-item {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    padding: 20px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.option-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    border-color: #667eea;
}

.option-text {
    flex: 1;
    font-size: 1.2em;
    font-weight: 500;
    color: #333;
}

.vote-btn {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    color: white;
    border: none;
    padding: 12px 25px;
    border-radius: 8px;
    cursor: pointer;
    margin-left: 15px;
    font-weight: 600;
    transition: all 0.3s ease;
}

.vote-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
}

.vote-count {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
    color: white;
    padding: 10px 20px;
    border-radius: 25px;
    font-weight: bold;
    margin-left: 15px;
    min-width: 80px;
    text-align: center;
}

.progress-bar {
    width: 100%;
    height: 10px;
    background: #e9ecef;
    border-radius: 5px;
    margin-top: 15px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transition: width 0.5s ease;
    border-radius: 5px;
}

/* Statistics Section */
.stats-section {
    margin-bottom: 40px;
    padding: 30px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 15px;
}

.stats-section h3 {
    margin-bottom: 20px;
    color: #333;
    font-size: 1.5em;
    text-align: center;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.stats-card {
    background: white;
    padding: 25px;
    border-radius: 15px;
    text-align: center;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.stats-card:hover {
    transform: translateY(-5px);
}

.stats-number {
    font-size: 2.5em;
    font-weight: bold;
    color: #667eea;
    margin-bottom: 10px;
}

.stats-label {
    font-size: 1.1em;
    color: #666;
    font-weight: 500;
}

/* Chart Section */
.chart-section {
    margin-bottom: 40px;
    padding: 30px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.chart-section h3 {
    margin-bottom: 20px;
    color: #333;
    font-size: 1.5em;
    text-align: center;
}

.chart-container {
    position: relative;
    height: 400px;
    margin: 20px 0;
}

/* Share Section */
.share-section {
    margin-bottom: 30px;
    padding: 30px;
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    border-radius: 15px;
    text-align: center;
}

.share-section h3 {
    margin-bottom: 20px;
    color: #333;
    font-size: 1.5em;
}

.share-buttons {
    margin-bottom: 20px;
}

.poll-link {
    background: white;
    padding: 15px;
    border-radius: 10px;
    font-family: monospace;
    font-size: 14px;
    color: #666;
    word-break: break-all;
    margin-top: 15px;
    border: 2px solid #e1e5e9;
}

/* Loading */
.loading {
    text-align: center;
    padding: 60px;
    color: #666;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Error */
.error {
    background: #f8d7da;
    color: #721c24;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    border: 1px solid #f5c6cb;
}

/* Utility Classes */
.hidden {
    display: none;
}

/* Responsive Design */
@media (max-width: 768px) {
    .container {
        margin: 10px;
        border-radius: 15px;
    }
    
    .header {
        padding: 30px 20px;
    }
    
    .header h1 {
        font-size: 2em;
    }
    
    .content {
        padding: 20px;
    }
    
    .poll-question {
        font-size: 1.5em;
    }
    
    .options-container {
        grid-template-columns: 1fr;
    }
    
    .option-item {
        flex-direction: column;
        text-align: center;
    }
    
    .vote-btn, .vote-count {
        margin: 10px 0 0 0;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
    }
    
    .chart-container {
        height: 300px;
    }
    
    .share-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .btn-share {
        margin: 0;
    }
}

@media (max-width: 480px) {
    body {
        padding: 10px;
    }
    
    .header h1 {
        font-size: 1.8em;
    }
    
    .poll-question {
        font-size: 1.3em;
    }
    
    .option-text {
        font-size: 1.1em;
    }
}

/* Animations */
.fade-in {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.slide-up {
    animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Success/Error States */
.success {
    border-color: #28a745;
    background-color: #d4edda;
}

.error-state {
    border-color: #dc3545;
    background-color: #f8d7da;
}

/* Hover Effects */
.option-item:hover .vote-btn {
    background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
}

.stats-card:hover .stats-number {
    color: #764ba2;
}`;
}

async function getAppJS() {
  return `// Real-time Polling App JavaScript
let currentPollId = null;
let websocket = null;
let resultsChart = null;
let activeUsers = 0;

// Generate a random poll ID
function generatePollId() {
    return 'poll_' + Math.random().toString(36).substr(2, 9);
}

// Add option input
function addOption() {
    const container = document.getElementById('optionsContainer');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'option-input';
    input.placeholder = 'Option ' + (container.children.length + 1);
    input.required = true;
    container.appendChild(input);
}

// Show create form
function showCreateForm() {
    document.getElementById('createForm').classList.remove('hidden');
    document.getElementById('pollDisplay').classList.add('hidden');
    document.getElementById('error').classList.add('hidden');
    if (websocket) {
        websocket.close();
        websocket = null;
    }
    if (resultsChart) {
        resultsChart.destroy();
        resultsChart = null;
    }
}

// Create poll
document.getElementById('pollForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const question = document.getElementById('question').value;
    const options = Array.from(document.querySelectorAll('.option-input'))
        .map(input => input.value.trim())
        .filter(option => option.length > 0);

    if (options.length < 2) {
        showError('Please add at least 2 options');
        return;
    }

    const pollId = generatePollId();
    currentPollId = pollId;

    try {
        showLoading();
        const response = await fetch('/api/create?pollId=' + pollId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, options })
        });

        if (response.ok) {
            loadPoll(pollId);
        } else {
            throw new Error('Failed to create poll');
        }
    } catch (error) {
        showError('Failed to create poll: ' + error.message);
    }
});

// Load poll
async function loadPoll(pollId) {
    try {
        showLoading();
        const response = await fetch('/api/get?pollId=' + pollId);
        const poll = await response.json();

        if (poll.error) {
            throw new Error(poll.error);
        }

        displayPoll(poll);
        connectWebSocket(pollId);
        updatePollLink(pollId);
        hideLoading();
    } catch (error) {
        showError('Failed to load poll: ' + error.message);
        hideLoading();
    }
}

// Display poll
function displayPoll(poll) {
    document.getElementById('pollQuestion').textContent = poll.question;
    
    const optionsContainer = document.getElementById('pollOptions');
    optionsContainer.innerHTML = '';

    const total = poll.total || 0;

    poll.options.forEach(option => {
        const votes = poll.votes[option] || 0;
        const percentage = total > 0 ? (votes / total * 100).toFixed(1) : 0;

        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-item fade-in';
        optionDiv.innerHTML = \`
            <div class="option-text">\${option}</div>
            <button class="vote-btn" onclick="vote('\${option}')">Vote</button>
            <div class="vote-count">\${votes} votes</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: \${percentage}%"></div>
            </div>
        \`;
        optionsContainer.appendChild(optionDiv);
    });

    updateStatistics(poll.votes, total);
    createChart(poll.options, poll.votes);
    
    document.getElementById('createForm').classList.add('hidden');
    document.getElementById('pollDisplay').classList.remove('hidden');
}

// Vote
async function vote(option) {
    try {
        const response = await fetch('/api/vote?pollId=' + currentPollId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ option })
        });

        if (!response.ok) {
            throw new Error('Failed to vote');
        }

        // Add visual feedback
        const voteBtn = event.target;
        voteBtn.textContent = 'Voted!';
        voteBtn.style.background = 'linear-gradient(135deg, #20c997 0%, #28a745 100%)';
        
        setTimeout(() => {
            voteBtn.textContent = 'Vote';
            voteBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        }, 1000);

    } catch (error) {
        showError('Failed to vote: ' + error.message);
    }
}

// Connect WebSocket
function connectWebSocket(pollId) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = protocol + '//' + window.location.host + '/ws/' + pollId;
    
    websocket = new WebSocket(wsUrl);
    
    websocket.onopen = function() {
        console.log('WebSocket connected');
        activeUsers++;
        updateActiveUsers();
    };
    
    websocket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        if (data.type === 'vote_update') {
            updateVotes(data.votes, data.total);
            updateStatistics(data.votes, data.total);
            updateChart(data.votes);
        } else if (data.type === 'poll_data') {
            displayPoll({
                question: data.poll.question,
                options: data.poll.options,
                votes: data.votes,
                total: data.total
            });
        } else if (data.type === 'user_count') {
            activeUsers = data.count;
            updateActiveUsers();
        }
    };

    websocket.onerror = function(error) {
        console.error('WebSocket error:', error);
    };

    websocket.onclose = function() {
        console.log('WebSocket connection closed');
        activeUsers = Math.max(0, activeUsers - 1);
        updateActiveUsers();
        
        // Try to reconnect after 3 seconds
        setTimeout(() => {
            if (currentPollId) {
                connectWebSocket(currentPollId);
            }
        }, 3000);
    };
}

// Update votes display
function updateVotes(votes, total) {
    const optionsContainer = document.getElementById('pollOptions');
    const optionItems = optionsContainer.querySelectorAll('.option-item');

    optionItems.forEach((item, index) => {
        const option = item.querySelector('.option-text').textContent;
        const votesCount = votes[option] || 0;
        const percentage = total > 0 ? (votesCount / total * 100).toFixed(1) : 0;

        item.querySelector('.vote-count').textContent = votesCount + ' votes';
        item.querySelector('.progress-fill').style.width = percentage + '%';
    });

    document.getElementById('totalVotes').textContent = total;
}

// Update statistics
function updateStatistics(votes, total) {
    document.getElementById('totalVotes').textContent = total;
    updateActiveUsers();
}

// Update active users
function updateActiveUsers() {
    document.getElementById('activeUsers').textContent = activeUsers;
}

// Create chart
function createChart(options, votes) {
    const ctx = document.getElementById('resultsChart').getContext('2d');
    
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe',
        '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'
    ];

    resultsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: options,
            datasets: [{
                data: options.map(option => votes[option] || 0),
                backgroundColor: colors.slice(0, options.length),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return \`\${context.label}: \${context.parsed} votes (\${percentage}%)\`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
}

// Update chart
function updateChart(votes) {
    if (resultsChart) {
        const options = resultsChart.data.labels;
        resultsChart.data.datasets[0].data = options.map(option => votes[option] || 0);
        resultsChart.update('active');
    }
}

// Update poll link
function updatePollLink(pollId) {
    const pollLink = window.location.origin + '/?poll=' + pollId;
    document.getElementById('pollLink').textContent = pollLink;
}

// Copy poll link
function copyPollLink() {
    const pollLink = document.getElementById('pollLink').textContent;
    navigator.clipboard.writeText(pollLink).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = 'linear-gradient(135deg, #20c997 0%, #28a745 100%)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        }, 2000);
    }).catch(err => {
        showError('Failed to copy link');
    });
}

// Share on Twitter
function shareOnTwitter() {
    const pollLink = document.getElementById('pollLink').textContent;
    const question = document.getElementById('pollQuestion').textContent;
    const text = \`Check out this poll: "\${question}" \${pollLink}\`;
    const url = \`https://twitter.com/intent/tweet?text=\${encodeURIComponent(text)}\`;
    window.open(url, '_blank');
}

// Show loading
function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('pollDisplay').classList.add('hidden');
    document.getElementById('createForm').classList.add('hidden');
}

// Hide loading
function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// Show error
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    hideLoading();
}

// Hide error
function hideError() {
    document.getElementById('error').classList.add('hidden');
}

// Check if URL has poll ID
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const pollId = urlParams.get('poll');
    
    if (pollId) {
        currentPollId = pollId;
        loadPoll(pollId);
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'n':
                e.preventDefault();
                showCreateForm();
                break;
            case 'r':
                e.preventDefault();
                if (currentPollId) {
                    loadPoll(currentPollId);
                }
                break;
        }
    }
});

// Add analytics tracking
function trackEvent(eventName, data = {}) {
    console.log('Event:', eventName, data);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, data);
    }
}

// Track poll creation
document.getElementById('pollForm').addEventListener('submit', () => {
    trackEvent('poll_created');
});

// Track votes
function vote(option) {
    trackEvent('vote_cast', { option });
}`;
} 