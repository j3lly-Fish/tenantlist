# ZYX Platform - Production Deployment Guide

This guide covers deploying the ZYX Platform authentication system to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Redis Configuration](#redis-configuration)
5. [Email Service Setup](#email-service-setup)
6. [S3 Bucket Configuration](#s3-bucket-configuration)
7. [OAuth Provider Setup](#oauth-provider-setup)
8. [HTTPS & SSL Certificates](#https--ssl-certificates)
9. [Monitoring & Error Tracking](#monitoring--error-tracking)
10. [Deployment Options](#deployment-options)
11. [Post-Deployment Checklist](#post-deployment-checklist)
12. [Security Hardening](#security-hardening)
13. [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js**: Version 18+ LTS
- **PostgreSQL**: Version 14+ (managed service recommended)
- **Redis**: Version 6+ (managed service recommended)
- **AWS Account**: For S3 storage and optional SES email
- **Domain**: Registered domain with DNS access
- **SSL Certificate**: Valid SSL/TLS certificate for HTTPS

## Environment Configuration

### 1. Generate Secrets

First, generate secure secrets for your production environment:

```bash
cd /home/zyx-platform
./scripts/generate-secrets.sh
```

This script generates:
- JWT_SECRET (64-byte base64)
- REFRESH_TOKEN_SECRET (64-byte base64)
- RSA key pair for JWT (RS256) - Optional
- Database and Redis passwords

**IMPORTANT**: Store these secrets securely. Never commit them to version control.

### 2. Configure Environment Variables

Copy the production environment template:

```bash
cp .env.production .env
```

Edit `.env` and fill in all values marked with `CHANGE_ME_*`. Use the secrets generated in step 1.

### 3. Validate Configuration

Ensure all required environment variables are set:

```bash
# Check for missing required variables
grep "CHANGE_ME" .env
# Should return no results if all values are set
```

## Database Setup

### Option 1: Managed PostgreSQL (Recommended)

**AWS RDS:**
```bash
# Create RDS PostgreSQL instance via AWS Console or CLI
aws rds create-db-instance \
  --db-instance-identifier zyx-production-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.7 \
  --master-username postgres \
  --master-user-password YOUR_STRONG_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx
```

**Railway/Render/Heroku:**
- Follow platform-specific instructions to provision PostgreSQL
- Copy connection string to `DATABASE_URL` in `.env`

### Option 2: Self-Hosted PostgreSQL

If self-hosting, ensure:
- PostgreSQL 14+ is installed
- SSL/TLS is enabled
- Firewall allows connections only from application servers
- Automated backups are configured

### Run Database Migrations

```bash
# Install dependencies
npm install

# Run migrations
npm run migrate:up

# Verify tables were created
npm run migrate:verify  # Add this script if needed
```

### Database Configuration Script

Run the production database setup script:

```bash
./scripts/setup-production-db.sh
```

This verifies:
- Database connectivity
- Required extensions (uuid-ossp, pgcrypto)
- Tables created successfully
- Indexes are in place

## Redis Configuration

### Option 1: Managed Redis (Recommended)

**AWS ElastiCache:**
```bash
aws elasticache create-replication-group \
  --replication-group-id zyx-production-redis \
  --replication-group-description "ZYX Platform Redis" \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token YOUR_REDIS_PASSWORD
```

**Redis Cloud / Upstash:**
- Sign up and create a database
- Copy connection URL to `REDIS_URL` in `.env`
- Ensure TLS is enabled (rediss:// protocol)

### Configuration Script

Run the Redis setup guidance script:

```bash
./scripts/setup-production-redis.sh
```

This provides:
- Configuration recommendations
- Security checklist
- Connection testing
- Performance tuning guidance

## Email Service Setup

### Option 1: SendGrid

1. **Sign up for SendGrid**
   - Visit https://sendgrid.com
   - Create account and verify email

2. **Create API Key**
   ```bash
   # Via SendGrid dashboard:
   # Settings > API Keys > Create API Key
   # Permissions: Mail Send (Full Access)
   ```

3. **Configure Domain Authentication**
   - Settings > Sender Authentication > Authenticate Your Domain
   - Add DNS records to your domain
   - Verify domain ownership

4. **Set Environment Variables**
   ```bash
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@zyx.com
   EMAIL_FROM_NAME=ZYX Platform
   ```

### Option 2: AWS SES

1. **Verify Email Domain**
   ```bash
   aws ses verify-domain-identity --domain zyx.com
   ```

2. **Add DNS Records**
   - Copy TXT record from AWS console
   - Add to your DNS provider

3. **Move Out of Sandbox**
   - Request production access via AWS console
   - Explain use case (transactional emails)

4. **Set Environment Variables**
   ```bash
   EMAIL_SERVICE=aws-ses
   AWS_SES_REGION=us-east-1
   AWS_SES_ACCESS_KEY_ID=AKIA...
   AWS_SES_SECRET_ACCESS_KEY=...
   EMAIL_FROM=noreply@zyx.com
   ```

### Test Email Configuration

Create a test script to verify email sending:

```bash
node -e "
const email = require('./src/services/email');
email.sendTestEmail('your-email@example.com')
  .then(() => console.log('Email sent successfully'))
  .catch(err => console.error('Email failed:', err));
"
```

## S3 Bucket Configuration

### 1. Create S3 Bucket

```bash
# Create bucket
aws s3api create-bucket \
  --bucket zyx-production-profile-photos \
  --region us-east-1 \
  --acl private

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket zyx-production-profile-photos \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket zyx-production-profile-photos \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'
```

### 2. Configure CORS

Create `s3-cors.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.zyx.com"],
      "AllowedMethods": ["GET", "PUT", "POST"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply CORS configuration:

```bash
aws s3api put-bucket-cors \
  --bucket zyx-production-profile-photos \
  --cors-configuration file://s3-cors.json
```

### 3. Create IAM User for S3 Access

```bash
# Create IAM user
aws iam create-user --user-name zyx-s3-uploader

# Create and attach policy
cat > s3-upload-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::zyx-production-profile-photos/*"
    }
  ]
}
EOF

aws iam put-user-policy \
  --user-name zyx-s3-uploader \
  --policy-name S3UploadPolicy \
  --policy-document file://s3-upload-policy.json

# Create access key
aws iam create-access-key --user-name zyx-s3-uploader
```

### 4. Set Environment Variables

```bash
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=zyx-production-profile-photos
AWS_REGION=us-east-1
```

### 5. Optional: Configure CloudFront CDN

For faster global delivery of profile photos:

```bash
# Create CloudFront distribution pointing to S3 bucket
# Update environment variable:
CDN_URL=https://d1234567890.cloudfront.net
USE_CDN=true
```

## OAuth Provider Setup

### Google OAuth 2.0

1. **Create Google Cloud Project**
   - Visit https://console.cloud.google.com
   - Create new project: "ZYX Platform"

2. **Enable Google+ API**
   - APIs & Services > Library
   - Search for "Google+ API"
   - Click Enable

3. **Create OAuth Credentials**
   - APIs & Services > Credentials
   - Create Credentials > OAuth client ID
   - Application type: Web application
   - Name: ZYX Platform Production
   - Authorized redirect URIs:
     - https://api.zyx.com/api/auth/oauth/google/callback

4. **Set Environment Variables**
   ```bash
   GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
   GOOGLE_CALLBACK_URL=https://api.zyx.com/api/auth/oauth/google/callback
   ```

### Facebook OAuth

1. **Create Facebook App**
   - Visit https://developers.facebook.com
   - My Apps > Create App
   - App type: Consumer
   - App name: ZYX Platform

2. **Configure Facebook Login**
   - Add Product > Facebook Login
   - Valid OAuth Redirect URIs:
     - https://api.zyx.com/api/auth/oauth/facebook/callback

3. **Set Environment Variables**
   ```bash
   FACEBOOK_APP_ID=123456789012345
   FACEBOOK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxx
   FACEBOOK_CALLBACK_URL=https://api.zyx.com/api/auth/oauth/facebook/callback
   ```

### Twitter OAuth 2.0

1. **Create Twitter App**
   - Visit https://developer.twitter.com/portal
   - Create Project and App
   - App name: ZYX Platform

2. **Configure OAuth 2.0**
   - App settings > User authentication settings
   - Type of App: Web App
   - Callback URI:
     - https://api.zyx.com/api/auth/oauth/twitter/callback

3. **Set Environment Variables**
   ```bash
   TWITTER_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
   TWITTER_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
   TWITTER_CALLBACK_URL=https://api.zyx.com/api/auth/oauth/twitter/callback
   ```

## HTTPS & SSL Certificates

### Option 1: Let's Encrypt (Free)

Using Certbot:

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate (DNS challenge)
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d api.zyx.com \
  -d app.zyx.com

# Certificates will be saved to:
# /etc/letsencrypt/live/api.zyx.com/fullchain.pem
# /etc/letsencrypt/live/api.zyx.com/privkey.pem

# Set environment variables
SSL_CERT_PATH=/etc/letsencrypt/live/api.zyx.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/api.zyx.com/privkey.pem

# Set up auto-renewal
sudo certbot renew --dry-run
```

### Option 2: AWS Certificate Manager (ACM)

If using AWS Load Balancer:

```bash
# Request certificate
aws acm request-certificate \
  --domain-name api.zyx.com \
  --subject-alternative-names app.zyx.com \
  --validation-method DNS

# Add DNS validation records
# Certificate will be automatically renewed by AWS
```

### Option 3: Commercial SSL Certificate

Purchase from providers like DigiCert, Comodo, or Sectigo.

### Configure HTTPS Enforcement

In `.env.production`:

```bash
FORCE_HTTPS=true
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
```

## Monitoring & Error Tracking

### Sentry Setup

1. **Create Sentry Project**
   - Visit https://sentry.io
   - Create new project
   - Platform: Node.js

2. **Install Sentry SDK**
   ```bash
   npm install @sentry/node @sentry/tracing
   ```

3. **Configure Environment Variables**
   ```bash
   SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
   SENTRY_ENVIRONMENT=production
   SENTRY_TRACES_SAMPLE_RATE=0.1
   SENTRY_ENABLED=true
   ```

4. **Verify Integration**
   - Deploy application
   - Check Sentry dashboard for events
   - Test error capture with intentional error

### Optional: Datadog APM

1. **Install Datadog Agent**
   ```bash
   npm install dd-trace
   ```

2. **Configure Environment Variables**
   ```bash
   DD_API_KEY=xxxxxxxxxxxxxxxxxxxxx
   DD_APP_KEY=xxxxxxxxxxxxxxxxxxxxx
   DD_SERVICE=zyx-api
   DD_ENV=production
   DD_VERSION=1.0.0
   ```

### Logging Configuration

Set up structured logging:

```bash
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=/var/log/zyx/api.log
LOG_ERROR_FILE=/var/log/zyx/error.log
```

Create log directory:

```bash
sudo mkdir -p /var/log/zyx
sudo chown $USER:$USER /var/log/zyx
```

## Deployment Options

### Option 1: Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Create New Project**
   ```bash
   railway init
   railway link
   ```

3. **Add Services**
   ```bash
   # Add PostgreSQL
   railway add postgresql

   # Add Redis
   railway add redis
   ```

4. **Set Environment Variables**
   ```bash
   # Copy all variables from .env.production
   railway variables set KEY=VALUE
   ```

5. **Deploy**
   ```bash
   railway up
   ```

### Option 2: AWS (EC2 + RDS + ElastiCache)

1. **Create EC2 Instance**
   ```bash
   # Launch Ubuntu 22.04 LTS instance
   # t3.medium or larger recommended
   # Configure security groups
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-org/zyx-platform.git
   cd zyx-platform

   # Install dependencies
   npm install --production

   # Copy environment file
   cp .env.production .env

   # Build TypeScript
   npm run build
   ```

4. **Set up Process Manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start npm --name "zyx-api" -- start
   pm2 save
   pm2 startup
   ```

5. **Configure Nginx Reverse Proxy**
   ```bash
   sudo apt-get install nginx

   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/zyx-api
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name api.zyx.com;

       location / {
           proxy_pass http://localhost:4000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/zyx-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 3: Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --production

   COPY . .
   RUN npm run build

   EXPOSE 4000

   CMD ["node", "dist/index.js"]
   ```

2. **Build Image**
   ```bash
   docker build -t zyx-platform:latest .
   ```

3. **Run Container**
   ```bash
   docker run -d \
     --name zyx-api \
     --env-file .env.production \
     -p 4000:4000 \
     zyx-platform:latest
   ```

### Option 4: Kubernetes

See `k8s/` directory for Kubernetes manifests (to be created).

## Post-Deployment Checklist

After deploying, verify the following:

### Health Checks

```bash
# Check application health
curl https://api.zyx.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-10-27T...",
  "uptime": 123.456,
  "checks": {
    "database": { "status": "pass", "responseTime": 50 },
    "redis": { "status": "pass", "responseTime": 10 },
    "memory": { "status": "pass" }
  }
}
```

### Database Connectivity

```bash
# Verify migrations
npm run migrate:status

# Test database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Redis Connectivity

```bash
# Test Redis
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD PING
# Expected: PONG
```

### Authentication Endpoints

```bash
# Test signup endpoint
curl -X POST https://api.zyx.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "role": "tenant",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+15551234567"
  }'
```

### SSL/HTTPS

```bash
# Verify SSL certificate
openssl s_client -connect api.zyx.com:443 -servername api.zyx.com

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=api.zyx.com
```

### Email Delivery

```bash
# Trigger password reset email
curl -X POST https://api.zyx.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "test@example.com" }'

# Check email inbox
```

### S3 Uploads

```bash
# Test profile photo upload
curl -X PATCH https://api.zyx.com/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "photo=@test-photo.jpg"
```

## Security Hardening

### 1. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (for redirect)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 3. Configure Fail2Ban

```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Enable Automatic Security Updates

```bash
sudo apt-get install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 5. Set Up Log Rotation

```bash
sudo nano /etc/logrotate.d/zyx

# Add:
/var/log/zyx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    sharedscripts
}
```

### 6. Regular Security Audits

```bash
# Run npm audit
npm audit

# Fix vulnerabilities
npm audit fix
```

## Troubleshooting

### Database Connection Issues

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT version();"

# Verify SSL settings
echo "sslmode=require" >> ~/.pg_service.conf

# Check firewall rules
sudo ufw status
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD PING

# Check Redis logs
sudo journalctl -u redis -n 100
```

### High Memory Usage

```bash
# Check memory usage
free -h
pm2 monit

# Restart application
pm2 restart zyx-api
```

### SSL Certificate Errors

```bash
# Verify certificate validity
openssl x509 -in /etc/letsencrypt/live/api.zyx.com/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --force-renewal
```

### Email Delivery Issues

```bash
# Check SendGrid status
curl https://status.sendgrid.com/api/v2/status.json

# Verify domain authentication
dig TXT _domainkey.zyx.com

# Check email logs
grep "email" /var/log/zyx/api.log
```

### Application Crashes

```bash
# Check PM2 logs
pm2 logs zyx-api --lines 100

# Check system logs
sudo journalctl -u zyx-api -n 100

# Monitor for errors
pm2 monit
```

## Rollback Procedure

If deployment fails:

```bash
# Revert to previous version
git checkout <previous-commit>
npm install
npm run build
pm2 restart zyx-api

# Rollback database migrations
npm run migrate:down
```

## Maintenance

### Database Backups

```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Automated daily backups (cron)
crontab -e
# Add: 0 2 * * * pg_dump $DATABASE_URL > /backups/zyx-$(date +\%Y\%m\%d).sql
```

### Log Rotation

Logs are automatically rotated daily and kept for 14 days (see logrotate configuration).

### Certificate Renewal

Let's Encrypt certificates auto-renew via certbot.

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test after updating
npm test
```

---

## Support

For deployment support:
- GitHub Issues: https://github.com/your-org/zyx-platform/issues
- Documentation: https://docs.zyx.com
- Email: devops@zyx.com
