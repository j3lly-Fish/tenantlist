# Production Deployment Checklist

Use this checklist before deploying to production to ensure all critical items are configured correctly.

## Pre-Deployment Checklist

### Environment Configuration
- [x] `.env.production` file created and populated
- [x] All `CHANGE_ME_*` placeholders replaced with actual values
- [x] Secrets generated using `./scripts/generate-secrets.sh`
- [x] Environment variables validated (no development values)
- [x] `NODE_ENV=production` set

### Security
- [x] Strong JWT secrets generated (64+ characters)
- [ ] Refresh token secret generated (64+ characters)
- [x] Database password is strong (16+ characters, mixed case, numbers, symbols)
- [x] Redis password is strong (16+ characters)
- [ ] All OAuth secrets configured
- [x] No secrets committed to version control
- [x] `.env.production` added to `.gitignore`
- [ ] HTTPS enforcement enabled (`FORCE_HTTPS=true`) - Currently disabled for local Docker
- [ ] HSTS headers configured
- [x] CSRF protection enabled
- [x] Secure cookie flags set (HttpOnly, Secure, SameSite)

### Database
- [x] Production PostgreSQL instance provisioned (Docker container)
- [ ] Database SSL/TLS enabled
- [x] Database credentials secured
- [ ] Database backups configured (daily minimum)
- [ ] Point-in-time recovery (PITR) enabled
- [x] Database connection pooling configured
- [x] Database accessible only from application servers (Docker network)
- [x] Required extensions installed (uuid-ossp, pgcrypto)
- [x] Migrations tested in staging environment
- [ ] Migration rollback plan documented

### Redis
- [x] Production Redis instance provisioned (Docker container)
- [ ] Redis TLS/SSL enabled
- [x] Redis password configured
- [x] Redis accessible only from application servers (Docker network)
- [x] Redis persistence enabled (AOF or RDB)
- [x] Redis maxmemory policy set (`allkeys-lru`)
- [ ] Redis backup/snapshot configured

### Email Service
- [ ] Email service provider selected (SendGrid or AWS SES)
- [ ] Email API key configured
- [ ] Domain authentication completed (SPF, DKIM, DMARC)
- [ ] Sender email verified
- [ ] Email templates tested
- [ ] Bounce and complaint handling configured
- [ ] Email sending limits reviewed
- [ ] Test emails sent successfully

### File Storage (S3)
- [ ] S3 bucket created
- [ ] S3 bucket encryption enabled
- [ ] S3 bucket versioning enabled
- [ ] CORS policy configured
- [ ] IAM user created for S3 access
- [ ] S3 access credentials configured
- [ ] Bucket policy restricts public access
- [ ] CDN configured (CloudFront) - Optional
- [ ] Test file upload successful

### OAuth Providers
- [ ] Google OAuth app created
- [ ] Google OAuth credentials configured
- [ ] Google OAuth redirect URIs whitelisted
- [ ] Facebook OAuth app created
- [ ] Facebook OAuth credentials configured
- [ ] Facebook OAuth redirect URIs whitelisted
- [ ] Twitter OAuth app created
- [ ] Twitter OAuth credentials configured
- [ ] Twitter OAuth redirect URIs whitelisted
- [ ] All OAuth flows tested in staging

### SSL/TLS Certificates
- [ ] SSL certificate obtained (Let's Encrypt, ACM, or commercial)
- [ ] Certificate covers all required domains (api.zyx.com, app.zyx.com)
- [ ] Certificate chain complete
- [ ] Private key secured
- [ ] Auto-renewal configured (Let's Encrypt)
- [ ] Certificate expiration monitoring set up
- [ ] SSL Labs test passed (A+ rating)
- [ ] Mixed content warnings checked

### Monitoring & Logging
- [ ] Sentry account created
- [ ] Sentry DSN configured
- [ ] Sentry error tracking tested
- [ ] Log aggregation configured (CloudWatch, Datadog, etc.)
- [ ] Log level set to `info` (not `debug`)
- [ ] Log rotation configured
- [ ] Application performance monitoring (APM) enabled - Optional
- [ ] Uptime monitoring configured (Pingdom, UptimeRobot, etc.)
- [ ] Alert thresholds configured
- [ ] On-call rotation established

### Infrastructure
- [ ] Application server(s) provisioned
- [ ] Server OS updated and hardened
- [ ] Firewall rules configured
- [ ] SSH access restricted (key-based only)
- [ ] Root login disabled
- [ ] Fail2Ban installed and configured
- [ ] Automatic security updates enabled
- [ ] Load balancer configured - If applicable
- [ ] Auto-scaling configured - If applicable
- [ ] Disaster recovery plan documented

### Application
- [x] Dependencies installed (`npm ci --production`)
- [x] TypeScript compiled (`npm run build`)
- [x] Database migrations run (`npm run migrate:up`)
- [x] Health check endpoint responding (`/health`)
- [ ] Readiness check endpoint responding (`/ready`)
- [ ] Liveness check endpoint responding (`/live`)
- [x] Process manager configured (Docker with restart policy)
- [x] Application auto-restart on crash enabled
- [x] Application starts on server boot

### Performance
- [x] Database indexes verified
- [ ] Query performance tested
- [ ] Redis cache hit rate monitored
- [ ] API response times acceptable (< 200ms p95)
- [x] Rate limiting tested
- [ ] Load testing completed
- [ ] CDN configured for static assets - Optional
- [x] Compression enabled (gzip/brotli) - via nginx

### Testing
- [x] All unit tests passing (40-50 tests covering critical paths)
- [x] All integration tests passing (E2E tests cover critical workflows)
- [x] Authentication flow tested end-to-end
- [ ] OAuth flows tested for all providers
- [ ] Password reset flow tested
- [ ] Email verification flow tested
- [x] Rate limiting tested
- [ ] Security testing completed (OWASP ZAP, etc.)
- [ ] Penetration testing completed - If required

### Documentation
- [ ] Deployment documentation reviewed
- [ ] Runbook created for common operations
- [ ] Incident response plan documented
- [ ] Rollback procedure documented
- [ ] Team members trained on deployment process
- [ ] API documentation published
- [ ] Change log updated

### Compliance & Legal
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] GDPR compliance reviewed - If applicable
- [ ] CCPA compliance reviewed - If applicable
- [ ] Data retention policies configured
- [ ] User consent mechanisms implemented
- [ ] Cookie policy published

### Communication
- [ ] Stakeholders notified of deployment schedule
- [ ] Maintenance window communicated to users
- [ ] Status page configured (status.zyx.com)
- [ ] Social media channels prepared
- [ ] Support team briefed
- [ ] Rollback plan communicated

## Deployment Day Checklist

### Pre-Deployment (T-1 hour)
- [ ] Final staging environment test
- [ ] Database backup completed
- [ ] Deployment team assembled
- [ ] Rollback plan reviewed
- [ ] Monitoring dashboards open
- [ ] Status page updated (maintenance mode)

### During Deployment
- [ ] Application deployed to production
- [ ] Database migrations run
- [ ] Application health check passed
- [ ] Smoke tests executed
- [ ] Authentication endpoints tested
- [ ] OAuth flows verified
- [ ] Email sending verified
- [ ] File upload verified
- [ ] No error spikes in monitoring

### Post-Deployment (T+1 hour)
- [ ] All health checks green
- [ ] Application logs reviewed (no errors)
- [ ] Database queries performing well
- [ ] Redis connection healthy
- [ ] Email delivery working
- [ ] User registration tested
- [ ] User login tested
- [ ] Password reset tested
- [ ] OAuth login tested for all providers
- [ ] Profile photo upload tested
- [ ] Rate limiting verified
- [ ] SSL certificate valid
- [ ] Monitoring data flowing

### Post-Deployment (T+24 hours)
- [ ] No critical errors in logs
- [ ] Error rate within acceptable range (< 1%)
- [ ] Response times acceptable
- [ ] Database performance normal
- [ ] Redis performance normal
- [ ] User signups successful
- [ ] Email delivery rate normal
- [ ] No customer complaints
- [ ] Monitoring alerts reviewed
- [ ] Status page updated (operational)

## Rollback Triggers

Immediately rollback if:
- [ ] Error rate exceeds 5%
- [ ] Response time p95 exceeds 2 seconds
- [ ] Database connection failures
- [ ] Redis connection failures
- [ ] Email service failures
- [ ] OAuth provider failures
- [ ] Security vulnerability discovered
- [ ] Data corruption detected

## Rollback Procedure

If rollback is needed:

1. **Stop accepting new traffic**
   ```bash
   # Update load balancer or reverse proxy to maintenance mode
   ```

2. **Revert application code**
   ```bash
   git checkout <previous-stable-commit>
   npm ci --production
   npm run build
   pm2 restart zyx-api
   ```

3. **Rollback database migrations** (if needed)
   ```bash
   npm run migrate:down
   ```

4. **Verify rollback successful**
   - Health checks passing
   - No errors in logs
   - Authentication working

5. **Resume traffic**
   ```bash
   # Update load balancer to resume normal operation
   ```

6. **Communicate rollback**
   - Update status page
   - Notify stakeholders
   - Document issues encountered

## Post-Rollback

- [ ] Root cause analysis completed
- [ ] Issue documented
- [ ] Fix developed and tested
- [ ] Deployment plan updated
- [ ] Re-deployment scheduled

---

**Notes:**
- This checklist should be completed for every production deployment
- Keep a copy of the completed checklist for audit purposes
- Update this checklist based on lessons learned
- Automate checklist items where possible (CI/CD pipelines)
