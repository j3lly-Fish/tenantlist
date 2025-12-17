# Deployment Checklist
## Tenant Dashboard Feature

**Version:** 1.0.0
**Date:** 2025-11-24
**Environment:** Production

---

## Pre-Deployment Checklist

### 1. Environment Variables ✅

#### Backend (.env)
```bash
# API Configuration
PORT=3000
NODE_ENV=production
API_BASE_URL=https://api.zyx.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DATABASE_SSL=true
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=5

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# JWT
JWT_SECRET=your-secure-jwt-secret-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=30d

# CORS
CORS_ORIGIN=https://zyx.com,https://www.zyx.com
CORS_CREDENTIALS=true

# WebSocket
WS_CORS_ORIGIN=https://zyx.com,https://www.zyx.com
```

**Verification:**
- [ ] All variables are set
- [ ] Secrets are strong (>32 characters)
- [ ] URLs point to production services
- [ ] SSL/TLS enabled for database and Redis
- [ ] CORS origins are correct

#### Frontend (.env.production)
```bash
# API Endpoints
VITE_API_BASE_URL=https://api.zyx.com
VITE_WS_BASE_URL=wss://api.zyx.com

# Feature Flags (if applicable)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
```

**Verification:**
- [ ] API URL points to production
- [ ] WebSocket uses WSS (secure)
- [ ] No development URLs present
- [ ] Feature flags correctly set

---

### 2. Database Migrations ✅

**Steps:**
1. Backup production database
2. Test migrations on staging
3. Run migrations on production

```bash
# Backup database
pg_dump -U username -h host -d database > backup_$(date +%Y%m%d).sql

# Test on staging
NODE_ENV=staging npm run migrate:up

# Run on production
NODE_ENV=production npm run migrate:up
```

**Verification:**
- [ ] Backup created successfully
- [ ] Migrations tested on staging
- [ ] All tables created (businesses, business_locations, business_metrics)
- [ ] Indexes created
- [ ] Foreign keys configured
- [ ] No errors in migration logs

**Rollback Plan:**
```bash
# If issues occur
NODE_ENV=production npm run migrate:down

# Restore from backup
psql -U username -h host -d database < backup_YYYYMMDD.sql
```

---

### 3. Build Optimization ✅

#### Backend Build
```bash
# Build TypeScript
npm run build

# Verify build output
ls -la dist/
```

**Verification:**
- [ ] TypeScript compiled successfully
- [ ] No compilation errors
- [ ] Source maps generated (for debugging)
- [ ] Build size acceptable (<10 MB)

#### Frontend Build
```bash
# Build React app
npm run build:frontend

# Check bundle size
ls -lah dist/assets/
```

**Verification:**
- [ ] Build completed without errors
- [ ] Bundle size under 500 KB (gzipped)
- [ ] Source maps generated
- [ ] Assets optimized (images, CSS)
- [ ] Index.html generated correctly

**Bundle Analysis:**
```bash
# Analyze bundle
npm run build:frontend -- --mode production

# Expected sizes (gzipped):
# - main.js: ~85 KB
# - dashboard.js: ~45 KB
# - vendor.js: ~45 KB
```

---

### 4. API Endpoint Configuration ✅

#### Verify All Endpoints

**Dashboard Endpoints:**
- [ ] `GET /api/dashboard/tenant` - Returns KPIs and businesses
- [ ] `GET /api/dashboard/tenant/kpis` - Returns KPIs only

**Business Endpoints:**
- [ ] `GET /api/businesses` - List with pagination
- [ ] `GET /api/businesses/:id` - Single business
- [ ] `GET /api/businesses/:id/locations` - Business locations
- [ ] `GET /api/businesses/:id/locations/:locationId/metrics` - Location metrics

**Health Check:**
- [ ] `GET /api/health` - Returns 200 OK
- [ ] `GET /api/health/db` - Database connectivity
- [ ] `GET /api/health/redis` - Redis connectivity

**Test Commands:**
```bash
# Test API health
curl https://api.zyx.com/api/health

# Test dashboard endpoint (requires authentication)
curl -H "Cookie: accessToken=TOKEN" https://api.zyx.com/api/dashboard/tenant

# Test businesses endpoint
curl -H "Authorization: Bearer TOKEN" https://api.zyx.com/api/businesses
```

---

### 5. WebSocket Configuration ✅

#### Server Configuration

**File:** `src/websocket/dashboardSocket.ts`

**Checklist:**
- [ ] Namespace configured: `/dashboard`
- [ ] JWT authentication enabled
- [ ] CORS configured for production
- [ ] Reconnection logic enabled
- [ ] Event handlers registered

**Test WebSocket Connection:**
```javascript
// In browser console
const socket = io('wss://api.zyx.com/dashboard', {
  auth: { token: 'YOUR_TOKEN' },
  withCredentials: true
});

socket.on('connect', () => console.log('Connected'));
socket.on('connect_error', (err) => console.error('Error:', err));
```

**Verification:**
- [ ] WebSocket connects successfully
- [ ] Authentication works
- [ ] Events emit correctly
- [ ] Reconnection works after disconnect
- [ ] Fallback to polling if WebSocket fails

---

### 6. CORS Settings ✅

#### Backend CORS Configuration

**File:** `src/app.ts` or `src/index.ts`

```typescript
import cors from 'cors';

app.use(cors({
  origin: ['https://zyx.com', 'https://www.zyx.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**WebSocket CORS:**
```typescript
const io = new Server(server, {
  cors: {
    origin: ['https://zyx.com', 'https://www.zyx.com'],
    credentials: true,
  },
});
```

**Verification:**
- [ ] CORS origins include production domains
- [ ] Credentials enabled (for cookies)
- [ ] Methods whitelisted
- [ ] Headers allowed
- [ ] WebSocket CORS matches REST API CORS

**Test CORS:**
```bash
# Test preflight request
curl -X OPTIONS https://api.zyx.com/api/dashboard/tenant \
  -H "Origin: https://zyx.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type"
```

---

### 7. CDN Configuration ✅

#### Static Assets

**Frontend Assets:**
- [ ] CSS files uploaded to CDN
- [ ] JavaScript bundles uploaded
- [ ] Images optimized and uploaded
- [ ] Source maps uploaded (private bucket)

**CDN Settings:**
- [ ] Cache-Control headers set
- [ ] Gzip compression enabled
- [ ] Brotli compression enabled (if available)
- [ ] HTTPS enforced
- [ ] Cache invalidation strategy defined

**Recommended Cache-Control:**
```
# HTML files
Cache-Control: no-cache

# JS/CSS with hashes
Cache-Control: public, max-age=31536000, immutable

# Images
Cache-Control: public, max-age=86400
```

---

### 8. SSL/TLS Certificates ✅

**Domains to Verify:**
- [ ] `zyx.com` - Valid SSL certificate
- [ ] `www.zyx.com` - Valid SSL certificate
- [ ] `api.zyx.com` - Valid SSL certificate

**Verification:**
```bash
# Check SSL certificate
openssl s_client -connect api.zyx.com:443 -servername api.zyx.com

# Check expiry
echo | openssl s_client -connect api.zyx.com:443 2>/dev/null | openssl x509 -noout -dates
```

**Requirements:**
- [ ] Certificate from trusted CA
- [ ] Not expired
- [ ] Covers all subdomains
- [ ] TLS 1.2+ only
- [ ] HTTP redirects to HTTPS

---

### 9. Security Checklist ✅

#### Authentication & Authorization
- [ ] JWT secrets are strong and unique
- [ ] httpOnly cookies enabled
- [ ] Secure flag set on cookies
- [ ] SameSite=Strict on cookies
- [ ] Token expiry configured (15 min access, 30 day refresh)
- [ ] Refresh token rotation enabled
- [ ] Role-based access control working

#### Input Validation
- [ ] XSS prevention on search inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] File upload validation (if applicable)
- [ ] Max request body size configured
- [ ] Rate limiting enabled

#### Headers
```javascript
// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.zyx.com", "wss://api.zyx.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

**Verification:**
- [ ] Content-Security-Policy header set
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Strict-Transport-Security header set
- [ ] X-XSS-Protection header set

---

### 10. Performance Optimization ✅

#### Backend
- [ ] Redis caching enabled for KPIs (5 min TTL)
- [ ] Database connection pooling configured
- [ ] Query optimization (indexes created)
- [ ] Gzip compression enabled
- [ ] Response caching headers set

#### Frontend
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Image lazy loading
- [ ] React.memo on frequently rendered components
- [ ] Debounced search input
- [ ] Intersection Observer for infinite scroll

**Performance Targets:**
- [ ] Time to Interactive < 1s
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Bundle size < 500 KB (gzipped)
- [ ] Lighthouse score > 90

---

### 11. Monitoring & Logging ✅

#### Application Monitoring
- [ ] Error tracking enabled (e.g., Sentry)
- [ ] Performance monitoring enabled (e.g., New Relic)
- [ ] Uptime monitoring configured (e.g., Pingdom)
- [ ] Log aggregation set up (e.g., CloudWatch, Datadog)

#### Alerts
- [ ] 5xx errors alert
- [ ] High response time alert (>2s)
- [ ] Database connection errors alert
- [ ] Redis connection errors alert
- [ ] WebSocket connection failures alert
- [ ] High memory usage alert (>80%)
- [ ] High CPU usage alert (>80%)

#### Logging
```typescript
// Structured logging
logger.info('Dashboard loaded', {
  userId: user.id,
  businessCount: businesses.length,
  responseTime: Date.now() - startTime,
});

logger.error('KPI calculation failed', {
  userId: user.id,
  error: error.message,
  stack: error.stack,
});
```

**Verification:**
- [ ] Logs are being collected
- [ ] Log retention policy set (30-90 days)
- [ ] Sensitive data not logged (passwords, tokens)
- [ ] Structured logging format (JSON)

---

### 12. Database Optimization ✅

#### Indexes
```sql
-- Verify indexes exist
\d+ businesses
\d+ business_locations
\d+ business_metrics

-- Expected indexes:
-- businesses: idx_businesses_user_id, idx_businesses_status, idx_businesses_created_at
-- business_locations: idx_business_locations_business_id
-- business_metrics: idx_business_metrics_business_id, idx_business_metrics_metric_date
```

#### Connection Pool
```javascript
const pool = new Pool({
  max: 20,           // Max connections
  min: 5,            // Min connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

**Verification:**
- [ ] Connection pool configured
- [ ] Max connections set appropriately
- [ ] Connection timeout configured
- [ ] Idle timeout configured
- [ ] Query timeout configured (10s)

---

### 13. Testing ✅

#### Run All Tests
```bash
# Unit tests
npm test

# Integration tests
npm test src/__tests__/api/

# E2E tests
npm test src/__tests__/e2e/

# Coverage report
npm run test:coverage
```

**Verification:**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Code coverage > 80%
- [ ] No flaky tests

#### Manual Testing
- [ ] Login as tenant user
- [ ] Dashboard loads with KPIs
- [ ] Business list displays correctly
- [ ] Search functionality works
- [ ] Filter functionality works
- [ ] Infinite scroll works
- [ ] WebSocket updates work
- [ ] Fallback to polling works
- [ ] Responsive design on mobile
- [ ] All links navigate correctly
- [ ] Error states display properly
- [ ] Offline mode works

---

### 14. Accessibility ✅

**WCAG 2.1 Level AA Compliance:**
- [ ] Keyboard navigation works
- [ ] Screen reader tested (NVDA/JAWS)
- [ ] Color contrast meets standards
- [ ] Focus indicators visible
- [ ] ARIA labels present
- [ ] Semantic HTML used
- [ ] Alt text on images
- [ ] Forms are accessible

**Tools:**
- [ ] Lighthouse accessibility audit (score > 90)
- [ ] axe DevTools scan (no critical issues)
- [ ] WAVE tool scan (no errors)

---

### 15. Browser Compatibility ✅

**Supported Browsers:**
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)

**Mobile:**
- [ ] iOS Safari (latest 2 versions)
- [ ] Chrome Android (latest 2 versions)

**Verification:**
- [ ] Tested on all supported browsers
- [ ] No console errors
- [ ] UI renders correctly
- [ ] Functionality works as expected

---

## Deployment Steps

### 1. Final Preparations

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm ci  # Use ci for clean install

# 3. Run tests one more time
npm test

# 4. Build backend
npm run build

# 5. Build frontend
npm run build:frontend

# 6. Verify builds
ls -la dist/
ls -la dist/assets/
```

### 2. Database Migration

```bash
# 1. Backup database
pg_dump -U username -h host -d database > backup_$(date +%Y%m%d).sql

# 2. Run migrations
NODE_ENV=production npm run migrate:up

# 3. Verify migrations
psql -U username -h host -d database -c "\dt"
```

### 3. Deploy Backend

```bash
# 1. Upload build to server
scp -r dist/ user@server:/path/to/app/

# 2. SSH into server
ssh user@server

# 3. Install production dependencies
cd /path/to/app
npm ci --production

# 4. Restart server
pm2 restart zyx-api

# 5. Verify server is running
pm2 status
curl http://localhost:3000/api/health
```

### 4. Deploy Frontend

```bash
# 1. Upload to CDN/S3
aws s3 sync dist/ s3://your-bucket/ --delete

# 2. Invalidate CloudFront cache (if using)
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"

# 3. Verify deployment
curl https://zyx.com
```

### 5. Post-Deployment Verification

#### Health Checks
```bash
# API health
curl https://api.zyx.com/api/health

# Database connection
curl https://api.zyx.com/api/health/db

# Redis connection
curl https://api.zyx.com/api/health/redis
```

#### Smoke Tests
- [ ] Access https://zyx.com
- [ ] Login as tenant user
- [ ] Dashboard loads successfully
- [ ] KPIs display correctly
- [ ] Business list loads
- [ ] Search works
- [ ] Filter works
- [ ] WebSocket connects (check Network tab)
- [ ] No console errors
- [ ] No 404 errors in Network tab

#### Monitoring
- [ ] Check error tracking dashboard (no new errors)
- [ ] Check server logs (no errors)
- [ ] Check response times (< 500ms for dashboard)
- [ ] Check WebSocket connections (successful)
- [ ] Check database queries (< 100ms average)

---

## Rollback Plan

### If Deployment Fails

#### Backend Rollback
```bash
# 1. Revert to previous version
pm2 restart zyx-api --update-env

# 2. If database migration is the issue
NODE_ENV=production npm run migrate:down

# 3. Restore database from backup (if necessary)
psql -U username -h host -d database < backup_YYYYMMDD.sql
```

#### Frontend Rollback
```bash
# 1. Restore previous S3 version
aws s3 cp s3://your-bucket-backup/ s3://your-bucket/ --recursive

# 2. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

#### Notify Stakeholders
- [ ] Post in #engineering channel
- [ ] Update status page
- [ ] Notify product team
- [ ] Document incident

---

## Post-Deployment

### 1. Monitor for 24 Hours

**Metrics to Watch:**
- [ ] Error rate (should be < 1%)
- [ ] Response time (should be < 500ms p95)
- [ ] WebSocket connection success rate (should be > 95%)
- [ ] Database query performance (should be < 100ms average)
- [ ] Memory usage (should be stable)
- [ ] CPU usage (should be < 70%)

### 2. User Feedback

- [ ] Monitor support tickets
- [ ] Check user feedback channels
- [ ] Review session recordings (if available)
- [ ] Analyze user behavior (analytics)

### 3. Documentation

- [ ] Update deployment notes
- [ ] Document any issues encountered
- [ ] Update runbook with lessons learned
- [ ] Share deployment summary with team

---

## Success Criteria

**Deployment is successful if:**

- ✅ All health checks pass
- ✅ Dashboard loads in < 1 second
- ✅ No critical errors in logs
- ✅ WebSocket connections stable
- ✅ All smoke tests pass
- ✅ Lighthouse score > 90
- ✅ Accessibility audit passes
- ✅ No P0/P1 bugs reported
- ✅ Response times within SLA
- ✅ Error rate < 1%

**If any criteria fail:**
1. Assess severity
2. Decide: hotfix or rollback
3. Execute plan
4. Verify fix
5. Document incident

---

## Emergency Contacts

**On-Call Engineer:** [Name] - [Phone]
**DevOps Lead:** [Name] - [Phone]
**Product Manager:** [Name] - [Phone]
**CTO:** [Name] - [Phone]

**Escalation Path:**
1. On-Call Engineer (15 min)
2. DevOps Lead (30 min)
3. CTO (1 hour)

---

## Appendix

### Useful Commands

```bash
# Check server status
pm2 status

# View logs
pm2 logs zyx-api

# Restart server
pm2 restart zyx-api

# Database connection
psql -U username -h host -d database

# Redis connection
redis-cli -h host -p 6379 -a password

# Check disk space
df -h

# Check memory
free -h

# Check CPU
top
```

### Environment URLs

- **Production:** https://zyx.com
- **API:** https://api.zyx.com
- **WebSocket:** wss://api.zyx.com
- **Staging:** https://staging.zyx.com
- **Admin Panel:** https://admin.zyx.com

---

**Checklist Version:** 1.0.0
**Last Updated:** 2025-11-24
**Next Review:** After each deployment
