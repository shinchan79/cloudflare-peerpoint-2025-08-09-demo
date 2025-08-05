// Real-time Polling App JavaScript
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
        optionDiv.innerHTML = `
            <div class="option-text">${option}</div>
            <button class="vote-btn" onclick="vote('${option}')">Vote</button>
            <div class="vote-count">${votes} votes</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${percentage}%"></div>
            </div>
        `;
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
                            return `${context.label}: ${context.parsed} votes (${percentage}%)`;
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
    const text = `Check out this poll: "${question}" ${pollLink}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
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

// Add service worker for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Add analytics tracking
function trackEvent(eventName, data = {}) {
    // Simple analytics tracking
    console.log('Event:', eventName, data);
    
    // You can integrate with Google Analytics or other services here
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
    // ... existing vote logic
}

// Add smooth scrolling for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Add confetti effect for successful vote (optional)
function addConfetti() {
    // Simple confetti effect
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c'];
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Add CSS animation for confetti
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
        }
    }
`;
document.head.appendChild(style); 