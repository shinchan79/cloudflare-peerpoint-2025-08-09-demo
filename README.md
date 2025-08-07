# Real-time Polling App với Cloudflare

Ứng dụng tạo bình chọn (polls) với kết quả cập nhật real-time. Khi ai đó vote, mọi người đang xem poll đều thấy kết quả update ngay lập tức mà không cần refresh.

## Mục lục

- [Tính năng chính](#-tính-năng-chính)
- [Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc code](#-cấu-trúc-code)
- [Hướng dẫn deploy từ scratch](#-hướng-dẫn-deploy-từ-scratch)
- [Giải thích chi tiết code](#-giải-thích-chi-tiết-code)
- [Troubleshooting](#-troubleshooting)

---

## Tính năng chính

- ✅ **Tạo poll** với câu hỏi và nhiều lựa chọn
- ✅ **Multi-vote support**
- ✅ **Real-time updates** qua WebSocket
- ✅ **Share link** 
- ✅ **Live statistics**
- ✅ **Anonymous user tracking** với localStorage

---

## Kiến trúc hệ thống

### **Tổng quan kiến trúc:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Cloudflare    │    │   Storage       │
│   (Browser)     │◄──►│   Workers       │◄──►│   KV + DO       │
│                 │    │                 │    │                 │
│ • HTML/CSS/JS   │    │ • API Gateway   │    │ • Poll Metadata │
│ • WebSocket     │    │ • Static Files  │    │ • User Votes    │
│ • Real-time UI  │    │ • Routing       │    │ • Live State    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Flow hoạt động:**

1. **Tạo Poll:**
   ```
   User → Worker → KV (metadata) → DO (state) → Response
   ```

2. **Vote:**
   ```
   User → Worker → DO (update state) → WebSocket (broadcast) → All clients
   ```

3. **Xem kết quả:**
   ```
   User → Worker → KV (metadata) + DO (current state) → Response
   ```

---

## Công nghệ sử dụng

### **Cloudflare Stack:**

| Công nghệ | Vai trò | Lý do chọn |
|-----------|---------|------------|
| **Workers** | API Gateway, Static Server | Edge computing, 0ms latency |
| **Durable Objects** | Real-time State Manager | Strong consistency, WebSocket |
| **KV Storage** | Global Metadata Store | Eventually consistent, fast reads |
| **WebSockets** | Real-time Communication | Live updates, low latency |

### **Frontend Stack:**
- **Vanilla JavaScript** - No framework dependencies
- **Chart.js** - Beautiful data visualization
- **CSS3** - Modern styling với gradients và animations
- **HTML5** - Semantic markup

---

## Cấu trúc code

```
polling-app/
├── src/
│   ├── index.js          # Main Worker - API Gateway
│   └── poll.js           # Durable Object - State Manager
├── public/
│   ├── index.html        # Main UI
│   ├── app.js           # Frontend logic
│   └── styles.css       # Styling
├── wrangler.toml        # Cloudflare config
├── package.json         # Dependencies
└── README.md           # This file
```

---

## Hướng dẫn deploy từ scratch

### **Bước 1: Setup môi trường**

```bash
# 1. Cài đặt Node.js (v18+)
node --version

# 2. Cài đặt Wrangler CLI
npm install -g wrangler

# 3. Login vào Cloudflare
npx wrangler login
```

### **Bước 2: Tạo project**

```bash
# 1. Tạo thư mục project
mkdir polling-app && cd polling-app

# 2. Khởi tạo package.json
npm init -y

# 3. Cài đặt dependencies
npm install -D wrangler
```

### **Bước 3: Tạo resources trên Cloudflare**

```bash
# 1. Tạo KV namespace cho metadata
npx wrangler kv namespace create "POLLS_KV"
npx wrangler kv namespace create "POLLS_KV" --preview

# 2. Lưu lại ID được trả về
# Ví dụ: 646885645fe84edc83137e1f25584f9e
```

### **Bước 4: Cấu hình wrangler.toml**

```toml
name = "polling-app"
main = "src/index.js"
compatibility_date = "2024-01-01"

# Durable Objects
[durable_objects]
bindings = [
  { name = "POLL", class_name = "Poll" }
]

[[migrations]]
tag = "v1"
new_classes = ["Poll"]

# KV Storage
[[kv_namespaces]]
binding = "POLLS_KV"
id = "YOUR_KV_ID_HERE"  # Thay bằng ID từ bước 3
preview_id = "YOUR_PREVIEW_KV_ID_HERE"

# Routes (optional)
routes = [
  { pattern = "polling-app.your-domain.workers.dev", zone_name = "your-domain.com" }
]
```

### **Bước 5: Tạo source code**

Tạo các file theo cấu trúc đã có trong project này.

### **Bước 6: Deploy**

```bash
# Deploy
npx wrangler deploy

```

### **Bước 7: Verify deployment**

1. Truy cập URL được deploy
2. Tạo poll test
3. Mở 2 tab để test real-time
4. Kiểm tra WebSocket connections

---

## 🔍 Giải thích code

### **1. Cloudflare Workers (src/index.js)**

**Vai trò:** API Gateway và Static File Server

```javascript
// Main entry point
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);ßßß
    const path = url.pathname;
    
    // Route requests
    if (path.startsWith("/api/")) {
      return handleAPI(request, env, path);
    }
    if (path.startsWith("/ws/")) {
      return handleWebSocket(request, env, path);
    }
    // Serve static files
    return serveStaticFile("index.html", env);
  }
};
```

**Tại sao Workers phù hợp:**
- ✅ **Edge computing** - Chạy tại 200+ locations
- ✅ **Serverless** - Không cần quản lý infrastructure  
- ✅ **Auto-scaling** - Handle từ 0 đến millions requests
- ✅ **Low latency** - Response time < 10ms

### **2. Durable Objects (src/poll.js)**

**Vai trò:** Real-time State Manager và WebSocket Handler

```javascript
export class Poll {
  constructor(state, env) {
    this.state = state;
    this.sessions = new Map(); // WebSocket connections
    this.votes = new Map();    // Vote counts
    this.userVotes = new Map(); // User's votes
  }
  
  async handleVote(request) {
    // Multi-vote logic
    if (userCurrentVotes.has(option)) {
      // Unvote
      userCurrentVotes.delete(option);
    } else {
      // Vote
      userCurrentVotes.add(option);
    }
    
    // Broadcast to all clients
    this.broadcast(updateData);
  }
}
```

**Tại sao dùng Durable Objects?**
- ✅ **Strong consistency**
- ✅ **Stateful WebSockets** - Traditional Workers stateless
- ✅ **Automatic persistence** - State tự động save

### **3. KV Storage**

**Vai trò:** Global Metadata Store

```javascript
// Store poll metadata
await env.POLLS_KV.put(pollId, JSON.stringify({
  question: createData.question,
  options: createData.options,
  created: Date.now()
}));
```

**Tại sao KV thay vì database:**
- ✅ **Eventually consistent** - OK cho metadata
- ✅ **Global replication** - Tự động replicate đến all regions
- ✅ **Key-value lookups** - Perfect cho simple lookups
- ✅ **Fast reads** - Optimized cho read-heavy workload

### **4. Frontend Logic (public/app.js)**

**Vai trò:** UI State Management và Real-time Updates

```javascript
// Stable user ID generation
function generateUserId() {
  let userId = localStorage.getItem('polling_user_id');
  if (!userId) {
    userId = `user_${timestamp}_${random}_${tabRandom}`;
    localStorage.setItem('polling_user_id', userId);
  }
  return userId;
}

// Real-time WebSocket connection
function connectWebSocket(pollId) {
  const wsUrl = `${protocol}//${window.location.host}/ws/${pollId}?userId=${currentUserId}`;
  websocket = new WebSocket(wsUrl);
  
  websocket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'vote_update') {
      updateVotes(data.votes, data.total);
      updateButtonStates();
    }
  };
}
```

### **5. Styling System (public/styles.css)**

**Vai trò:** Responsive Design và Visual Feedback

```css
/* User voted state*/
.option-item.user-voted {
  border: 2px solid #28a745 !important;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%) !important;
  box-shadow: 0 5px 15px rgba(40, 167, 69, 0.2) !important;
}

/* Cross-browser compatibility */
* {
  -webkit-transition: all 0.3s ease;
  -moz-transition: all 0.3s ease;
  transition: all 0.3s ease;
}
```

---

## Troubleshooting

### **Vấn đề thường gặp:**

#### **1. WebSocket không kết nối**
```bash
# Kiểm tra logs
wrangler tail
```

#### **2. Styling không hiển thị đúng**
```javascript
// Force reflow
element.offsetHeight;

// Debug styling
function debugStyling() {
  const items = document.querySelectorAll('.option-item');
  items.forEach(item => {
    console.log(item.classList.contains('user-voted'));
    console.log(item.style.border);
  });
}
```

#### **3. KV không lưu được data**
```bash
# Kiểm tra KV binding
wrangler kv:list --binding=POLLS_KV

# Test KV operations
wrangler kv:key put --binding=POLLS_KV "test" "value"
wrangler kv:key get --binding=POLLS_KV "test"
```

#### **4. Performance issues**
```javascript
// Optimize WebSocket messages
const message = {
  type: "vote_update",
  votes: Object.fromEntries(this.votes),
  total: Array.from(this.votes.values()).reduce((a, b) => a + b, 0),
  userVotes: Array.from(userCurrentVotes)
};
```

---

## Monitoring & Analytics

### **Cloudflare Analytics:**
- **Workers Analytics** - Request counts, response times
- **KV Analytics** - Read/write operations
- **Durable Objects Analytics** - Active instances, storage usage

### **Custom Metrics:**
```javascript
// Track custom metrics
async function trackMetric(name, value) {
  await env.POLLS_KV.put(`metric:${name}:${Date.now()}`, value);
}
```

---

## Security Considerations

### **Rate Limiting:**
- Implement per-user rate limiting
- Use Cloudflare's built-in DDoS protection

### **Input Validation:**
```javascript
function validatePollData(data) {
  if (!data.question || data.question.length > 500) {
    throw new Error('Invalid question');
  }
  if (!data.options || data.options.length < 2 || data.options.length > 10) {
    throw new Error('Invalid options');
  }
}
```

### **CORS Configuration:**
```javascript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
```

---

## Reference resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
- [KV Storage API](https://developers.cloudflare.com/kv/)
- [WebSocket API](https://developers.cloudflare.com/workers/runtime-apis/websockets/)