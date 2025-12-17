#!/bin/bash

# Production Redis Setup Script
# This script provides configuration guidance for Redis in production
# Use with managed Redis services (AWS ElastiCache, Redis Cloud, Upstash)

set -e

echo "============================================"
echo "ZYX Platform - Production Redis Setup"
echo "============================================"
echo ""

# Check if Redis is configured
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | grep 'REDIS' | xargs) 2>/dev/null || true
fi

echo "Redis Configuration Checklist:"
echo ""

echo "1. REDIS SERVICE SELECTION"
echo "   Recommended managed services:"
echo "   - AWS ElastiCache (Redis)"
echo "   - Redis Cloud (Redis Labs)"
echo "   - Upstash (Serverless Redis)"
echo "   - Azure Cache for Redis"
echo ""

echo "2. REDIS CONFIGURATION"
echo "   Required settings in .env.production:"
echo "   ✓ REDIS_URL=rediss://username:password@host:port"
echo "   ✓ REDIS_HOST=your-redis-host"
echo "   ✓ REDIS_PORT=6380 (6379 for non-TLS)"
echo "   ✓ REDIS_PASSWORD=strong-password"
echo "   ✓ REDIS_TLS=true"
echo ""

echo "3. SECURITY SETTINGS"
echo "   ✓ Enable TLS/SSL encryption (rediss:// protocol)"
echo "   ✓ Use strong password authentication"
echo "   ✓ Restrict network access to application servers only"
echo "   ✓ Enable at-rest encryption (if supported)"
echo "   ✓ Configure VPC peering (AWS) or private networking"
echo ""

echo "4. PERFORMANCE SETTINGS"
echo "   Recommended configuration:"
echo "   - maxmemory-policy: allkeys-lru (for rate limiting)"
echo "   - maxmemory: Set based on your workload (minimum 256MB)"
echo "   - timeout: 300 (close idle connections after 5 minutes)"
echo "   - tcp-keepalive: 60"
echo ""

echo "5. HIGH AVAILABILITY"
echo "   ✓ Enable automatic failover (Redis Sentinel or Cluster mode)"
echo "   ✓ Configure replication (minimum 1 replica)"
echo "   ✓ Enable persistence (AOF recommended for rate limiting)"
echo "   ✓ Set up monitoring and alerts"
echo ""

echo "6. BACKUP & RECOVERY"
echo "   ✓ Enable automated backups (daily snapshots)"
echo "   ✓ Configure backup retention (7-30 days)"
echo "   ✓ Test restore procedures regularly"
echo ""

# Test Redis connection if configured
if [ ! -z "$REDIS_URL" ]; then
    echo "7. TESTING REDIS CONNECTION"
    echo "   Testing connection to: $REDIS_HOST:$REDIS_PORT"

    # Try to ping Redis using redis-cli if available
    if command -v redis-cli &> /dev/null; then
        if [ "$REDIS_TLS" = "true" ]; then
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --tls PING 2>/dev/null | grep -q PONG; then
                echo "   ✓ Redis connection successful!"
            else
                echo "   ✗ Redis connection failed. Please verify credentials and network access."
            fi
        else
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" PING 2>/dev/null | grep -q PONG; then
                echo "   ✓ Redis connection successful!"
            else
                echo "   ✗ Redis connection failed. Please verify credentials and network access."
            fi
        fi
    else
        echo "   ℹ redis-cli not installed. Skipping connection test."
        echo "   Install redis-cli to test connection: apt-get install redis-tools"
    fi
    echo ""
fi

echo "============================================"
echo "Redis Use Cases in ZYX Platform:"
echo "============================================"
echo "1. Rate Limiting"
echo "   - Login attempts (5 per email, 10 per IP per 15 min)"
echo "   - Password reset requests (3 per hour per email)"
echo "   - Email verification resends (3 per hour per email)"
echo ""
echo "2. Session Management"
echo "   - JWT token blacklist (for logout)"
echo "   - CSRF token storage"
echo "   - OAuth state parameters"
echo ""
echo "3. Caching (Future)"
echo "   - User profile data"
echo "   - Dashboard statistics"
echo "   - Search results"
echo ""

echo "============================================"
echo "Monitoring Recommendations:"
echo "============================================"
echo "Key metrics to monitor:"
echo "- Memory usage (should stay under 80%)"
echo "- Hit rate (target > 80% for caching)"
echo "- Evicted keys (should be minimal)"
echo "- Connected clients"
echo "- Operations per second"
echo "- Latency (p50, p95, p99)"
echo ""

echo "Set up alerts for:"
echo "- Memory usage > 80%"
echo "- Replication lag > 5 seconds"
echo "- Connection failures"
echo "- High eviction rate"
echo ""

echo "============================================"
echo "Production Redis Setup Guidance Complete!"
echo "============================================"
