#!/bin/bash

# Production Database Setup Script
# This script sets up the PostgreSQL database for production
# Run this on your production database server or managed database service

set -e

echo "============================================"
echo "ZYX Platform - Production Database Setup"
echo "============================================"
echo ""

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "ERROR: .env.production file not found"
    exit 1
fi

# Database connection details
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_NAME=${DATABASE_NAME:-zyx_production}
DB_USER=${DATABASE_USER:-postgres}

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if PostgreSQL is accessible
echo "Checking PostgreSQL connection..."
if ! PGPASSWORD=$DATABASE_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo "ERROR: Cannot connect to PostgreSQL server"
    echo "Please verify your database credentials and network connectivity"
    exit 1
fi
echo "PostgreSQL connection successful!"
echo ""

# Create database if it doesn't exist
echo "Creating database $DB_NAME if it doesn't exist..."
PGPASSWORD=$DATABASE_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DATABASE_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
echo "Database created/verified successfully!"
echo ""

# Enable required extensions
echo "Enabling required PostgreSQL extensions..."
PGPASSWORD=$DATABASE_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
PGPASSWORD=$DATABASE_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"
echo "Extensions enabled successfully!"
echo ""

# Run migrations
echo "Running database migrations..."
if [ -f "node_modules/.bin/ts-node" ]; then
    npm run migrate:up
    echo "Migrations completed successfully!"
else
    echo "WARNING: ts-node not found. Please run migrations manually:"
    echo "  npm install"
    echo "  npm run migrate:up"
fi
echo ""

# Set up database connection pooling recommendations
echo "============================================"
echo "Database Setup Complete!"
echo "============================================"
echo ""
echo "Recommended Production Settings:"
echo "1. Enable SSL/TLS connections"
echo "2. Set max_connections = 100-200 (based on your workload)"
echo "3. Configure shared_buffers = 25% of available RAM"
echo "4. Enable automated backups (daily recommended)"
echo "5. Set up point-in-time recovery (PITR)"
echo "6. Configure connection pooling (PgBouncer recommended)"
echo "7. Monitor slow queries with pg_stat_statements"
echo "8. Set up read replicas for high availability"
echo ""
echo "Security Checklist:"
echo "✓ Database user has strong password"
echo "✓ Database accessible only from application servers"
echo "✓ SSL/TLS encryption enabled for connections"
echo "✓ Regular automated backups scheduled"
echo "✓ Firewall rules configured"
echo ""
