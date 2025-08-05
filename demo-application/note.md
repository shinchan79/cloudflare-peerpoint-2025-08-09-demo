## 📊 Real-time Live Polling App

### **Mô tả ngắn gọn:**
Ứng dụng tạo bình chọn (polls) với kết quả cập nhật real-time. Khi ai đó vote, mọi người đang xem poll đều thấy kết quả update ngay lập tức mà không cần refresh.

### **Chức năng core:**
- Tạo poll với câu hỏi và nhiều lựa chọn
- Share link để mọi người vote
- Xem kết quả update real-time (WebSocket)
- Biểu đồ thống kê votes

---

## **Phân tích vai trò từng Cloudflare Tool:**

### **1. Workers - Router & API Gateway**
**Vai trò cụ thể:**
- **Request routing**: Nhận requests từ users, phân loại và điều hướng đến đúng service
- **API endpoints**: `/create`, `/list`, `/delete` - xử lý business logic đơn giản
- **Static serving**: Serve HTML/CSS/JS cho frontend
- **Middleware**: Rate limiting, CORS, authentication check

**Tại sao Workers phù hợp:**
- Chạy tại edge (200+ locations) → response cực nhanh
- Serverless → không cần quản lý infrastructure
- Auto-scaling → handle từ 0 đến millions requests

### **2. Durable Objects - Real-time State Manager**
**Vai trò cụ thể:**
- **State coordination**: Mỗi poll = 1 DO instance, giữ single source of truth
- **WebSocket handler**: Quản lý tất cả active connections của 1 poll
- **Live broadcasting**: Khi có vote mới → broadcast cho all viewers instantly
- **In-memory caching**: Giữ current votes trong RAM để query instant

**Tại sao PHẢI dùng Durable Objects:**
- **Strong consistency**: Không có race conditions khi nhiều người vote cùng lúc
- **Stateful WebSockets**: Traditional Workers stateless, không giữ được connections
- **Location affinity**: DO instance chạy ở 1 location → low latency cho state updates
- **Automatic persistence**: State tự động save, survive restarts

**So sánh approaches:**
```
Traditional: Client → Server → Redis (state) → PostgreSQL → Broadcast via Pusher/Socket.io
Cloudflare:  Client → Worker → Durable Object (everything in one place)
```

### **3. KV Storage - Global Metadata Store**
**Vai trò cụ thể:**
- **Poll registry**: Map poll_id → poll metadata (title, options, created_date)
- **User's polls**: Map user_id → [poll_ids] để list polls của user
- **Short URLs**: Map short_code → poll_id cho pretty URLs

**Tại sao KV thay vì database:**
- **Eventually consistent**: OK cho metadata không cần strong consistency
- **Global replication**: Tự động replicate đến all regions
- **Key-value lookups**: Perfect cho simple lookups by ID
- **Fast reads**: Optimized cho read-heavy workload

### **4. D1 Database (Optional) - Analytics & History**
**Vai trò cụ thể:**
- **Vote logs**: Lưu mọi vote với timestamp, IP, location
- **Analytics queries**: "Votes by hour", "Geographic distribution"
- **User accounts**: Nếu có authentication system

**Khi nào cần D1:**
- Complex queries với JOINs, GROUP BY
- Time-series analysis
- Audit trail requirements

---

## **Flow Architecture & Tool Interaction:**

```
CREATE POLL:
User → Worker (validate) → KV (save metadata) → Return URL
           ↓
    Create DO instance

VOTING:
User → Worker (route) → Durable Object (update state)
                              ↓
                        Broadcast via WebSocket
                              ↓
                        All clients update

VIEW RESULTS:
User → Worker → KV (get metadata) → DO (get current state) → Return data
```

---

## **Các bước thực hiện chính:**

### **Bước 1: Setup project**
```bash
mkdir polling-app && cd polling-app
npm init -y
npm install -D wrangler
wrangler login
```

### **Bước 2: Tạo resources**
```bash
# KV namespace cho metadata
wrangler kv:namespace create "POLLS_KV"
wrangler kv:namespace create "POLLS_KV" --preview

# D1 database (optional)
wrangler d1 create polling-analytics
```

### **Bước 3: Config wrangler.toml**
```toml
name = "polling-app"
main = "src/index.js"
compatibility_date = "2024-01-01"

[durable_objects]
bindings = [{name = "POLL", class_name = "Poll"}]

[[kv_namespaces]]
binding = "POLLS_KV"
id = "xxx"

[[d1_databases]]
binding = "DB"
database_name = "polling-analytics"
database_id = "yyy"
```

### **Bước 4: Implement Durable Object**
- Handle WebSocket upgrade
- Manage vote state
- Broadcast updates

### **Bước 5: Implement Worker**
- Route requests
- CRUD operations via KV
- Forward to DO for real-time

### **Bước 6: Frontend**
- Create poll form
- WebSocket connection for live updates
- Chart visualization

### **Bước 7: Deploy**
```bash
# First time với DO
wrangler deploy

# Local testing
wrangler dev --local --persist
```

### **Bước 8: Verify deployment**
- Check DO enabled trong dashboard
- Test WebSocket connections
- Verify KV operations

---

## **Lưu ý quan trọng:**

**1. Durable Objects activation:**
- Dashboard → Workers → Settings → Durable Objects → Enable
- First deploy cần migration tag

**2. WebSocket URLs:**
- Production: `wss://your-worker.workers.dev`
- Local: `ws://localhost:8787`

**3. KV consistency:**
- KV là eventually consistent (~60s globally)
- Dùng DO cho data cần strong consistency

**4. Costs consideration:**
- DO: $0.15/million requests + duration
- KV: Read heavy cheaper than write heavy
- WebSocket: Tính theo duration connection
