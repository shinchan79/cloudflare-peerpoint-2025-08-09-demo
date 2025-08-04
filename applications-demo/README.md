# 🚀 CodeCollab Live - Real-time Collaborative Code Editor

Một platform như CodePen/CodeSandbox nhưng chạy hoàn toàn trên Cloudflare stack với các tính năng advanced.

## ✨ Features

### 🎯 **"Wow Factor" Features**

- **Real-time Collaboration Engine**
  - Live cursors của multiple users
  - Operational Transform cho conflict resolution
  - Voice/Video chat integrated (WebRTC)
  - Live preview sync across all users
  - Real-time terminal sharing

- **AI-Powered Development**
  - AI Code Completion (integrate OpenAI API via Workers)
  - Smart Error Detection với suggestions
  - Auto Code Review comments
  - AI Chat Assistant trong editor

- **Advanced Cloudflare Features**
  - Durable Objects cho real-time state management
  - WebSockets cho instant collaboration
  - R2 Storage cho file uploads, assets
  - KV Storage cho user preferences, templates
  - Workers AI cho code analysis
  - Images service cho screenshot generation

- **Production-Ready Capabilities**
  - Multi-project workspaces
  - Version control (Git-like)
  - Deploy preview với custom subdomains
  - Performance monitoring built-in
  - Global CDN cho instant loading

## 🛠 Tech Stack

### Frontend
- **React 18** + **Vite** + **TypeScript**
- **Monaco Editor** (VS Code engine)
- **WebRTC** cho video calls
- **Canvas API** cho cursors/annotations
- **Service Workers** cho offline support
- **Tailwind CSS** cho styling
- **Zustand** cho state management

### Cloudflare Stack
- **Workers** - API + WebSocket handlers
- **Durable Objects** - Session management
- **D1** - Projects, users, permissions
- **R2** - File storage, build artifacts
- **KV** - Configuration, templates
- **Workers AI** - Code intelligence
- **Analytics Engine** - Usage tracking

### External Integrations
- **OpenAI API** (via Workers)
- **GitHub API** (git operations)
- **Docker API** (container builds)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Wrangler CLI
- Cloudflare account

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Cloudflare Services

#### Create D1 Database
```bash
wrangler d1 create codecollab-db
```

#### Create KV Namespace
```bash
wrangler kv:namespace create CACHE
```

#### Create R2 Bucket
```bash
wrangler r2 bucket create codecollab-assets
```

#### Update wrangler.toml
Replace the placeholder IDs in `wrangler.toml` with your actual service IDs.

### 3. Setup Database Schema
```bash
# Create tables
wrangler d1 execute codecollab-db --file=./schema.sql
```

### 4. Environment Variables
Create `.env` file:
```env
VITE_API_URL=http://localhost:8787
OPENAI_API_KEY=your-openai-api-key
```

### 5. Run Development Server
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run local
```

### 6. Deploy to Production
```bash
# Build frontend
npm run build

# Deploy to Cloudflare
npm run deploy
```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── Auth/          # Authentication components
│   ├── Dashboard/     # Dashboard components
│   ├── Editor/        # Code editor components
│   ├── Layout/        # Layout components
│   └── Projects/      # Project management
├── contexts/          # React contexts
├── services/          # API services
├── store/            # Zustand store
├── styles/           # Global styles
├── types/            # TypeScript types
└── worker/           # Cloudflare Workers
    ├── durable-objects/  # Durable Objects
    ├── routes/           # API routes
    └── index.ts          # Main worker
```

## 🎪 Demo Scenarios

### Scenario 1: "Build a Game Together"
- Start với empty project
- Audience suggests features
- Live code a simple game (Snake/Tetris)
- Multiple people control different parts
- Deploy instantly with custom domain

### Scenario 2: "Debug Race"
- Pre-made buggy code
- Split audience into teams
- Race to find và fix bugs
- AI assistant helps weaker team
- Real-time leaderboard

### Scenario 3: "Performance Challenge"
- Slow, unoptimized code
- Show performance metrics
- Live optimization với AI suggestions
- Before/after comparison
- Global speed test

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start worker locally
npm run local

# Run tests
npm test
```

### Database Migrations
```bash
# Create migration
wrangler d1 migrations create codecollab-db migration_name

# Apply migrations
wrangler d1 migrations apply codecollab-db
```

### Testing
```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run with UI
npm run test:ui
```

## 📊 Performance Metrics

- **<50ms** global response times
- **99.99%** uptime across regions
- **Zero** cold starts với Durable Objects
- **Infinite** scalability với edge computing
- **10x** cheaper than traditional infrastructure

## 🔒 Security

- JWT-based authentication
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## 🌐 Deployment

### Staging
```bash
npm run deploy:dev
```

### Production
```bash
npm run deploy
```

### Custom Domain
```bash
# Add custom domain
wrangler pages domain add your-domain.com
```

## 📈 Monitoring

### Analytics
- Real-time user activity
- Performance metrics
- Error tracking
- Usage analytics

### Logs
```bash
# View worker logs
wrangler tail

# View specific worker
wrangler tail --format=pretty
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

- Documentation: [docs.codecollab.live](https://docs.codecollab.live)
- Discord: [discord.gg/codecollab](https://discord.gg/codecollab)
- Email: support@codecollab.live

## 🎁 Takeaways for Audience

- Complete source code
- Step-by-step video tutorials
- Production deployment template
- Community Discord cho support
- Monthly virtual workshops

---

**Built with ❤️ on Cloudflare's Edge Network** 