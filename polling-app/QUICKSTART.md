# 🚀 Quick Start Guide

## Cài đặt nhanh (5 phút)

### 1. Login Cloudflare
```bash
npx wrangler login
```

### 2. Tạo KV namespace
```bash
# Production
npx wrangler kv:namespace create "POLLS_KV"

# Preview (cho development)
npx wrangler kv:namespace create "POLLS_KV" --preview
```

### 3. Cập nhật wrangler.toml
Thay thế `your-kv-namespace-id` và `your-preview-kv-namespace-id` với ID thực từ bước 2.

### 4. Chạy local
```bash
npm run dev
```

### 5. Mở browser
Truy cập: `http://localhost:8787`

## 🎯 Test nhanh

### Tạo poll:
1. Nhập câu hỏi: "What's your favorite color?"
2. Thêm options: "Red", "Blue", "Green"
3. Click "Create Poll"

### Vote real-time:
1. Mở 2 tab browser
2. Vote ở tab 1
3. Xem kết quả update ở tab 2

### Test WebSocket:
```javascript
// Trong browser console
const ws = new WebSocket('ws://localhost:8787/ws/poll_abc123');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

## 📊 Tính năng đã có

✅ **Real-time Polling** - Vote và xem kết quả ngay lập tức  
✅ **Beautiful Charts** - Doughnut chart với Chart.js  
✅ **Live Statistics** - Total votes và active users  
✅ **Share Links** - Copy link và share Twitter  
✅ **Responsive Design** - Hoạt động trên mobile  
✅ **WebSocket Connection** - Auto reconnect  
✅ **Modern UI** - Gradient, animations, hover effects  

## 🔧 Troubleshooting

### Lỗi thường gặp:

1. **"KV namespace not found"**
   - Chạy lại bước 2 và cập nhật wrangler.toml

2. **"WebSocket connection failed"**
   - Kiểm tra Durable Objects đã enable chưa
   - Chạy `npx wrangler deploy` lần đầu

3. **"Chart not loading"**
   - Kiểm tra internet connection (Chart.js từ CDN)
   - Refresh browser

### Debug commands:
```bash
# Xem logs
npx wrangler tail

# Test API
node demo.js

# Deploy production
npx wrangler deploy
```

## 🎨 Customization

### Thay đổi màu sắc:
Edit `public/styles.css` - tìm `#667eea` và `#764ba2`

### Thêm options:
Edit `public/app.js` - tìm `addOption()` function

### Thay đổi chart type:
Edit `public/app.js` - tìm `type: 'doughnut'` trong `createChart()`

## 📱 Mobile Testing

1. Chạy local: `npm run dev`
2. Lấy IP local: `ifconfig` hoặc `ipconfig`
3. Mở `http://YOUR_IP:8787` trên mobile
4. Test responsive design

## 🚀 Production Deploy

```bash
# Deploy lần đầu
npx wrangler deploy

# URL sẽ là: https://polling-app.YOUR_SUBDOMAIN.workers.dev
```

## 💡 Tips

- **Keyboard shortcuts**: Ctrl+N (new poll), Ctrl+R (refresh)
- **Auto-reconnect**: WebSocket tự động reconnect khi mất kết nối
- **Caching**: Static files được cache 1 giờ
- **Analytics**: Console logs cho tracking events

## 🎉 Done!

Bạn đã có một ứng dụng polling hoàn chỉnh với:
- Real-time updates
- Beautiful charts
- Modern UI
- Mobile responsive
- Share functionality

Happy coding! 🎊 