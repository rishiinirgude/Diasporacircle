# Deployment Guide

This guide covers deploying DiasporaCircle to production on Stellar Testnet.

---

## Prerequisites

- [Stellar CLI](https://developers.stellar.org/docs/learn/administration/stellar-cli/installation)
- [Node.js 20+](https://nodejs.org/)
- Docker (optional, for local database)
- A Stellar testnet account with XLM for fees (~50 XLM)
- Deployment platform account (Vercel, Railway, Render, etc.)

---

## Step 1: Deploy Smart Contracts to Testnet

### 1.1 Create Testnet Account

```bash
# Use Friendbot to fund a new testnet account
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"

# Verify funding
stellar account info YOUR_PUBLIC_KEY --testnet
```

### 1.2 Deploy Circle Contract

```bash
cd packages/contracts/circle

# Build contract
make build

# Deploy to testnet
make deploy NETWORK=testnet SOURCE=your-testnet-alias

# Contract ID will be saved to .contract-id
cat .contract-id
```

**Output:**
```
Deploying to testnet...
Contract ID: CAUOI...HWVUQ
Contract ID saved to .contract-id
```

### 1.3 Deploy Reputation Contract

```bash
cd packages/contracts/reputation

# Build
make build

# Deploy
make deploy NETWORK=testnet SOURCE=your-testnet-alias

# Get contract ID
cat .contract-id
```

### 1.4 Update Environment Variables

In your `.env` file:
```env
CIRCLE_CONTRACT_ID=CAUOI...HWVUQ
REPUTATION_CONTRACT_ID=CAXYZ...PQRST
```

---

## Step 2: Deploy Backend

### Option A: Railway (Recommended for MVP)

```bash
# 1. Sign up at https://railway.app
# 2. Create new project
# 3. Connect GitHub repo
# 4. Configure build:
#    - Build command: pnpm --filter backend run build
#    - Start command: pnpm --filter backend run start
# 5. Add environment variables:
#    - NODE_ENV=production
#    - DATABASE_URL=postgresql://user:pass@host/db
#    - REDIS_URL=redis://host:port
#    - All from .env file
# 6. Deploy database: Add PostgreSQL service
# 7. Deploy Redis: Add Redis service
```

### Option B: Render

```bash
# 1. Sign up at https://render.com
# 2. Create new Web Service
# 3. Connect GitHub repo
# 4. Configure:
#    - Runtime: Node
#    - Build: pnpm --filter backend run build
#    - Start: pnpm --filter backend run start
# 5. Add environment variables
# 6. Add PostgreSQL database
# 7. Deploy
```

### Option C: Vercel (with custom deployment)

```bash
# 1. Deploy to separate Node.js host (not Vercel for backend)
# 2. Use API routes only if using Vercel Serverless
```

### Backend Post-Deployment

```bash
# SSH into your server or use platform CLI:

# Run database migrations
DATABASE_URL=... npx prisma migrate deploy

# Verify health check
curl https://your-backend.com/health
# Expected: { "ok": true, "timestamp": "..." }
```

---

## Step 3: Deploy Frontend

### Option A: Vercel

```bash
# 1. Connect GitHub repo to Vercel
# 2. Configure build settings:
#    - Framework: Vite
#    - Build command: pnpm --filter frontend run build
#    - Output directory: packages/frontend/dist
# 3. Set environment variables:
#    - VITE_API_URL=https://your-backend.com/api
# 4. Deploy
```

### Option B: Netlify

```bash
# 1. Connect GitHub repo
# 2. Build settings:
#    - Package manager: pnpm
#    - Build command: pnpm --filter frontend run build
#    - Publish directory: packages/frontend/dist
# 3. Environment variables:
#    - VITE_API_URL=https://your-backend.com/api
# 4. Deploy
```

### Option C: Self-hosted (NGINX)

```bash
# Build
pnpm --filter frontend run build

# Upload dist/ to server
scp -r packages/frontend/dist user@server:/var/www/diasporacircle

# Configure NGINX
```

**NGINX config:**
```nginx
server {
    listen 80;
    server_name diasporacircle.dev;

    location / {
        root /var/www/diasporacircle;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend-server:3001;
    }
}
```

---

## Step 4: Production Checklist

### Before Going Live

- [ ] Smart contracts deployed to testnet
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Backend health check passes
- [ ] Frontend builds successfully
- [ ] API endpoints tested manually
- [ ] CORS configured correctly
- [ ] SSL/TLS certificates installed
- [ ] Custom domain configured
- [ ] Email/SMS services configured (optional)
- [ ] Monitoring/logging set up
- [ ] Backups configured

### Testing Production

```bash
# 1. Test wallet connection
curl -X POST https://your-backend.com/api/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"GXXXXXX"}'

# 2. Open frontend, connect wallet
# 3. Create test circle
# 4. Test contribution flow
# 5. Verify on Stellar Expert: 
#    https://stellar.expert/explorer/testnet
```

---

## Step 5: Monitoring & Maintenance

### Logging

```bash
# Check backend logs (varies by platform):
# Railway: railway logs
# Render: View logs in dashboard
# Self-hosted: tail -f /var/log/app.log
```

### Database Backups

```bash
# PostgreSQL backup
pg_dump DATABASE_URL > backup.sql

# Restore
psql DATABASE_URL < backup.sql
```

### Health Checks

```bash
# Set up monitoring to ping every 5 minutes
GET /health

# Expected: { "ok": true }
```

### Updates & Patches

```bash
# Pull latest changes
git pull origin main

# Rebuild
pnpm build

# Migrate database (if schema changed)
pnpm --filter backend run db:migrate

# Redeploy (platform-specific)
```

---

## Step 6: Security Hardening

### Environment Variables

Store secrets securely:
- **Never** commit `.env` to Git
- Use platform-managed secrets
- Rotate JWT_SECRET regularly

### SSL/TLS

```bash
# Use Let's Encrypt (free)
# - Railway/Render: Auto-configured
# - Self-hosted: Use certbot
sudo certbot certonly --nginx -d diasporacircle.dev
```

### Rate Limiting

Add to Express backend:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### CORS

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## Step 7: Performance Optimization

### Frontend

```bash
# Enable gzip compression
# Configure CDN (Cloudflare, AWS CloudFront)
# Optimize images
# Lazy load routes
```

### Backend

```bash
# Database query optimization
# Add indexes to frequently queried fields
# Enable Redis caching
# Use connection pooling
```

---

## Step 8: Disaster Recovery

### Database Backup Plan

```bash
# Automated backups every 6 hours
0 */6 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +%Y%m%d-%H%M%S).sql.gz
```

### Failover Plan

1. Multiple database replicas
2. Redis persistence
3. Load balancer
4. DNS failover

---

## Troubleshooting

### Backend won't start

```bash
# Check environment variables
echo $DATABASE_URL
echo $CIRCLE_CONTRACT_ID

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check Redis connection
redis-cli ping
```

### Frontend can't reach backend

```bash
# Check CORS
curl -i -X OPTIONS https://your-backend.com/api/circles \
  -H "Origin: https://your-frontend.com" \
  -H "Access-Control-Request-Method: GET"

# Check API_URL in frontend env
echo $VITE_API_URL
```

### Transactions fail

```bash
# Check contract IDs
curl https://stellar.expert/api/v2/contractexplorer/contracts/CAUOI...

# Check account balance
stellar account info YOUR_ACCOUNT --testnet

# Verify network
stellar network info
```

---

## Monitoring Checklist

- [ ] Uptime monitoring (Pingdom, UptimeRobot)
- [ ] Error tracking (Sentry, Rollbar)
- [ ] Application performance (New Relic, Datadog)
- [ ] Database monitoring
- [ ] Disk space alerts
- [ ] CPU/Memory alerts
- [ ] Log aggregation (ELK Stack, CloudWatch)

---

## Support

For deployment issues:
- Check logs first
- Review environment variables
- Test individual services
- Open GitHub issue with:
  - Platform used
  - Error message
  - Steps to reproduce

---

**Deployed:** [Your Live URL]  
**Last Updated:** 2026-07-10
