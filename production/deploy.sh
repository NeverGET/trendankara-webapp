#!/bin/bash

# ====================================
# Deployment Script for Radio CMS
# ====================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}======================================"
echo "Radio CMS Deployment Script"
echo "======================================${NC}"
echo ""

# Check if environment is specified
if [ -z "$1" ]; then
    echo -e "${RED}Error: Please specify environment (staging or production)${NC}"
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

ENVIRONMENT=$1

# Load configuration based on environment
case $ENVIRONMENT in
    staging)
        SERVER_USER="user"
        SERVER_HOST="staging.yourdomain.com"
        APP_DIR="/var/www/radio-cms-staging"
        ENV_FILE=".env.staging"
        PM2_NAME="radio-cms-staging"
        ;;
    production)
        SERVER_USER="user"
        SERVER_HOST="trendankara.com"
        APP_DIR="/var/www/radio-cms"
        ENV_FILE=".env.production"
        PM2_NAME="radio-cms"
        ;;
    *)
        echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'${NC}"
        exit 1
        ;;
esac

echo "Deployment Configuration:"
echo "========================"
echo "Environment: $ENVIRONMENT"
echo "Server: $SERVER_USER@$SERVER_HOST"
echo "Directory: $APP_DIR"
echo ""

read -p "Proceed with deployment? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Building application locally...${NC}"

# Build the application
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed${NC}"

echo ""
echo -e "${YELLOW}Step 2: Creating deployment package...${NC}"

# Create deployment directory
DEPLOY_DIR="deployment_$(date +%Y%m%d_%H%M%S)"
mkdir -p $DEPLOY_DIR

# Copy necessary files
cp -r .next $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp -r prisma $DEPLOY_DIR/ 2>/dev/null || true
cp package*.json $DEPLOY_DIR/
cp next.config.* $DEPLOY_DIR/ 2>/dev/null || true
cp ecosystem.config.js $DEPLOY_DIR/ 2>/dev/null || true

# Create tarball
tar -czf deployment.tar.gz $DEPLOY_DIR

echo -e "${GREEN}✅ Deployment package created${NC}"

echo ""
echo -e "${YELLOW}Step 3: Uploading to server...${NC}"

# Upload to server
scp deployment.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

if [ $? -ne 0 ]; then
    echo -e "${RED}Upload failed!${NC}"
    rm -rf $DEPLOY_DIR deployment.tar.gz
    exit 1
fi

echo -e "${GREEN}✅ Package uploaded${NC}"

echo ""
echo -e "${YELLOW}Step 4: Deploying on server...${NC}"

# Execute deployment on server
ssh $SERVER_USER@$SERVER_HOST << ENDSSH
set -e

echo "Extracting deployment package..."
cd /tmp
tar -xzf deployment.tar.gz

echo "Backing up current deployment..."
if [ -d "$APP_DIR" ]; then
    sudo cp -r $APP_DIR ${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)
fi

echo "Deploying new version..."
sudo mkdir -p $APP_DIR
sudo rm -rf $APP_DIR/.next $APP_DIR/public
sudo mv $DEPLOY_DIR/.next $APP_DIR/
sudo mv $DEPLOY_DIR/public $APP_DIR/
sudo mv $DEPLOY_DIR/package*.json $APP_DIR/

if [ -f $DEPLOY_DIR/next.config.js ] || [ -f $DEPLOY_DIR/next.config.mjs ]; then
    sudo mv $DEPLOY_DIR/next.config.* $APP_DIR/
fi

if [ -f $DEPLOY_DIR/ecosystem.config.js ]; then
    sudo mv $DEPLOY_DIR/ecosystem.config.js $APP_DIR/
fi

if [ -d $DEPLOY_DIR/prisma ]; then
    sudo mv $DEPLOY_DIR/prisma $APP_DIR/
fi

# Set permissions
sudo chown -R www-data:www-data $APP_DIR

echo "Installing dependencies..."
cd $APP_DIR
sudo -u www-data npm ci --production

# Run database migrations if Prisma is used
if [ -d "$APP_DIR/prisma" ]; then
    echo "Running database migrations..."
    sudo -u www-data npx prisma migrate deploy
fi

echo "Restarting application..."
# Check if PM2 process exists
if pm2 list | grep -q "$PM2_NAME"; then
    pm2 reload $PM2_NAME --update-env
else
    # Start new PM2 process
    if [ -f "$APP_DIR/ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --name $PM2_NAME --env $ENVIRONMENT
    else
        pm2 start npm --name $PM2_NAME -- start
    fi
fi

pm2 save

echo "Cleaning up..."
rm -rf /tmp/deployment.tar.gz /tmp/$DEPLOY_DIR

echo "Checking application status..."
sleep 5
pm2 status $PM2_NAME

# Health check
echo "Running health check..."
curl -f http://localhost:3000/api/health || exit 1

echo "✅ Deployment completed successfully!"
ENDSSH

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================="
    echo "✅ Deployment Completed Successfully!"
    echo "=========================================${NC}"
    echo ""
    echo "Application is now running on $ENVIRONMENT"
    echo ""

    # Clean up local files
    rm -rf $DEPLOY_DIR deployment.tar.gz
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    rm -rf $DEPLOY_DIR deployment.tar.gz
    exit 1
fi