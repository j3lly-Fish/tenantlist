#!/bin/bash
# Production Docker Compose Helper Script
# This script ensures environment variables are loaded before running docker compose

# Load environment variables from .env.production
set -a
source .env.production 2>/dev/null || {
    echo "Error: .env.production file not found"
    exit 1
}
set +a

# Run docker compose with production config and pass through all arguments
docker compose -f docker-compose.prod.yml "$@"
