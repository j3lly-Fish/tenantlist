#!/bin/bash

# Generate Secrets for Production Deployment
# This script generates cryptographically secure secrets for the ZYX Platform
# Run this script before deploying to production

set -e

echo "============================================"
echo "ZYX Platform - Secret Generation Script"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Generate JWT Secret (64-byte base64)
echo -e "${GREEN}Generating JWT_SECRET...${NC}"
JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "JWT_SECRET=$JWT_SECRET"
echo ""

# Generate Refresh Token Secret (64-byte base64)
echo -e "${GREEN}Generating REFRESH_TOKEN_SECRET...${NC}"
REFRESH_TOKEN_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "REFRESH_TOKEN_SECRET=$REFRESH_TOKEN_SECRET"
echo ""

# Generate RSA key pair for JWT (RS256) - Optional but recommended
echo -e "${GREEN}Generating RSA key pair for JWT (RS256)...${NC}"
echo -e "${YELLOW}This generates a 4096-bit RSA key pair.${NC}"
echo ""

# Create temp directory for keys
TEMP_DIR=$(mktemp -d)
PRIVATE_KEY_FILE="$TEMP_DIR/jwt_private.pem"
PUBLIC_KEY_FILE="$TEMP_DIR/jwt_public.pem"

# Generate private key
openssl genrsa -out "$PRIVATE_KEY_FILE" 4096 2>/dev/null

# Extract public key
openssl rsa -in "$PRIVATE_KEY_FILE" -pubout -out "$PUBLIC_KEY_FILE" 2>/dev/null

echo "JWT_PRIVATE_KEY (store securely, never commit to version control):"
cat "$PRIVATE_KEY_FILE"
echo ""
echo ""

echo "JWT_PUBLIC_KEY:"
cat "$PUBLIC_KEY_FILE"
echo ""
echo ""

# Generate CSRF Secret
echo -e "${GREEN}Generating CSRF_SECRET...${NC}"
CSRF_SECRET=$(openssl rand -base64 32 | tr -d '\n')
echo "CSRF_SECRET=$CSRF_SECRET"
echo ""

# Generate Session Secret
echo -e "${GREEN}Generating SESSION_SECRET...${NC}"
SESSION_SECRET=$(openssl rand -base64 64 | tr -d '\n')
echo "SESSION_SECRET=$SESSION_SECRET"
echo ""

# Generate Database Password
echo -e "${GREEN}Generating DATABASE_PASSWORD...${NC}"
DATABASE_PASSWORD=$(openssl rand -base64 32 | tr -d '\n' | tr '+/' '-_')
echo "DATABASE_PASSWORD=$DATABASE_PASSWORD"
echo ""

# Generate Redis Password
echo -e "${GREEN}Generating REDIS_PASSWORD...${NC}"
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n' | tr '+/' '-_')
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo ""

echo "============================================"
echo -e "${YELLOW}IMPORTANT SECURITY NOTES:${NC}"
echo "============================================"
echo "1. Copy these secrets to your .env.production file"
echo "2. NEVER commit .env.production to version control"
echo "3. Store secrets in a secure secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)"
echo "4. Rotate secrets regularly (every 90 days recommended)"
echo "5. Use different secrets for staging and production environments"
echo "6. Private key file location: $PRIVATE_KEY_FILE"
echo "7. Public key file location: $PUBLIC_KEY_FILE"
echo ""
echo -e "${GREEN}Clean up temporary files:${NC}"
echo "rm -rf $TEMP_DIR"
echo ""
echo "============================================"
echo -e "${GREEN}Secret generation complete!${NC}"
echo "============================================"
