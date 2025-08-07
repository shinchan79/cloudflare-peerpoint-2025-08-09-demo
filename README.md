# 🗳️ Real-time Polling App

Ứng dụng tạo bình chọn (polls) với kết quả cập nhật real-time sử dụng Cloudflare Workers, Durable Objects và KV Storage.

## ✨ Tính năng

- ✅ Tạo poll với câu hỏi và nhiều lựa chọn
- ✅ Vote và xem kết quả real-time
- ✅ WebSocket connection cho live updates
- ✅ UI đẹp và responsive
- ✅ Share link để mọi người vote
- ✅ Progress bar và thống kê votes

## 🏗️ Kiến trúc

```
Frontend (HTML/JS) → Worker → Durable Object (State + WebSocket)
                              ↓
                        KV Storage (Metadata)
```

### Cloudflare Tools được sử dụng:

1. **Workers** - Router & API Gateway
2. **Durable Objects** - Real-time State Manager & WebSocket
3. **KV Storage** - Global Metadata Store

## 🚀 Setup

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Login vào Cloudflare

```bash
npx wrangler login
```

### 3. Tạo KV namespace

```bash
# Tạo KV namespace cho production
npx wrangler kv:namespace create "POLLS_KV"

# Tạo KV namespace cho preview
npx wrangler kv:namespace create "POLLS_KV" --preview
```

### 4. Cập nhật wrangler.toml

Thay thế `your-kv-namespace-id` và `your-preview-kv-namespace-id` trong file `wrangler.toml` với ID thực từ bước 3.

### 5. Deploy

```bash
# Deploy lần đầu
npx wrangler deploy

# Hoặc chạy local để test
npx wrangler dev --local --persist
```

## 🎯 Cách sử dụng

### Tạo poll mới:
1. Mở ứng dụng
2. Nhập câu hỏi
3. Thêm các lựa chọn (ít nhất 2)
4. Click "Create Poll"
5. Share link với bạn bè

### Vote:
1. Mở link poll
2. Click "Vote" bên cạnh lựa chọn yêu thích
3. Xem kết quả update real-time

## 🔧 API Endpoints

- `POST /api/create?pollId=xxx` - Tạo poll mới
- `POST /api/vote?pollId=xxx` - Vote cho option
- `GET /api/get?pollId=xxx` - Lấy thông tin poll
- `WS /ws/{pollId}` - WebSocket connection cho real-time updates

## 📊 Dữ liệu

### Poll Structure:
```json
{
  "id": "poll_abc123",
  "question": "What's your favorite color?",
  "options": ["Red", "Blue", "Green"],
  "votes": {
    "Red": 5,
    "Blue": 3,
    "Green": 2
  },
  "total": 10
}
```

## 🎨 UI Features

- **Modern Design**: Gradient background, card layout
- **Real-time Updates**: WebSocket connection
- **Progress Bars**: Visual representation of votes
- **Responsive**: Works on mobile and desktop
- **Interactive**: Hover effects, smooth animations

## 🔍 Debug

### Local Development:
```bash
npx wrangler dev --local --persist
```

### Check Logs:
```bash
npx wrangler tail
```

### Test WebSocket:
```javascript
// Trong browser console
const ws = new WebSocket('ws://localhost:8787/ws/poll_abc123');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

## 💡 Tips

1. **Durable Objects**: Mỗi poll = 1 DO instance, giữ state và WebSocket connections
2. **KV Storage**: Lưu metadata, không lưu votes (votes ở DO)
3. **WebSocket**: Tự động reconnect khi mất kết nối
4. **Error Handling**: Graceful fallback khi có lỗi

## 🚀 Production Deployment

1. Update `wrangler.toml` với production settings
2. Run `npx wrangler deploy`
3. Enable Durable Objects trong Cloudflare Dashboard
4. Test WebSocket connections

## 📈 Performance

- **Edge Computing**: 200+ locations worldwide
- **Low Latency**: < 50ms response time
- **Auto-scaling**: Handle 0 to millions requests
- **Cost Effective**: Pay per request

## 🛠️ Troubleshooting

### Common Issues:

1. **WebSocket not connecting**: Check if Durable Objects enabled
2. **KV errors**: Verify namespace IDs in wrangler.toml
3. **CORS errors**: Check CORS headers in Worker
4. **State not persisting**: DO state auto-saves, KV is eventually consistent

### Debug Commands:
```bash
# Check deployment status
npx wrangler whoami

# View KV data
npx wrangler kv:key list --binding=POLLS_KV

# Test locally
npx wrangler dev --local --persist
```

## 📝 License

MIT License - Feel free to use and modify! 