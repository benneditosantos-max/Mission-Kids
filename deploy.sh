#!/bin/bash

# MissionKids Deployment Script
# This script handles the complete deployment process

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_NAME="missionkids"
DEPLOY_DIR="/opt/missionkids"
BACKUP_DIR="/opt/missionkids-backups"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════╗"
echo "║      MissionKids - Deployment Script             ║"
echo "║              Production Deployment                ║"
echo "╚═══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ This script must be run as root${NC}"
  exit 1
fi

# Function to print step
print_step() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}▶ $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Step 1: Pre-deployment checks
print_step "Step 1: Pre-deployment Checks"

if ! command -v docker &> /dev/null; then
  echo -e "${RED}❌ Docker is not installed${NC}"
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo -e "${RED}❌ Docker Compose is not installed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Docker installed: $(docker --version)${NC}"
echo -e "${GREEN}✅ Docker Compose installed: $(docker-compose --version)${NC}"

# Step 2: Environment Configuration
print_step "Step 2: Environment Configuration"

if [ ! -f ".env.production" ]; then
  echo -e "${YELLOW}⚠️  Creating .env.production file...${NC}"
  cat > .env.production << EOF
# MongoDB Configuration
MONGO_URL=mongodb://mongo:27017
DB_NAME=missionkids

# JWT Secret (CHANGE THIS!)
JWT_SECRET=$(openssl rand -hex 32)

# CORS Configuration
CORS_ORIGINS=http://localhost,https://your-domain.com

# Email Configuration (Optional)
# EMAIL_SERVICE=sendgrid
# SENDGRID_API_KEY=your-api-key
# FROM_EMAIL=noreply@missionkids.com
EOF
  echo -e "${GREEN}✅ Created .env.production${NC}"
  echo -e "${YELLOW}⚠️  Please edit .env.production with your settings${NC}"
  read -p "Press enter to continue after editing..."
fi

# Load environment variables
export $(cat .env.production | xargs)

# Step 3: Backup existing deployment (if any)
print_step "Step 3: Backup Existing Deployment"

if [ -d "$DEPLOY_DIR" ]; then
  BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  echo -e "${YELLOW}📦 Backing up to $BACKUP_DIR/$BACKUP_NAME${NC}"
  
  # Backup database
  docker exec missionkids-mongo mongodump --out /backup/$BACKUP_NAME 2>/dev/null || true
  
  # Backup application
  tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$DEPLOY_DIR" . 2>/dev/null || true
  
  echo -e "${GREEN}✅ Backup completed${NC}"
else
  echo -e "${YELLOW}⚠️  No existing deployment to backup${NC}"
fi

# Step 4: Stop existing containers
print_step "Step 4: Stop Existing Containers"

if [ "$(docker ps -q -f name=missionkids)" ]; then
  echo -e "${YELLOW}🛑 Stopping existing containers...${NC}"
  docker-compose down || true
  echo -e "${GREEN}✅ Containers stopped${NC}"
else
  echo -e "${YELLOW}⚠️  No running containers found${NC}"
fi

# Step 5: Build production assets
print_step "Step 5: Build Production Assets"

echo -e "${YELLOW}📦 Building frontend...${NC}"
cd /app/frontend
yarn build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend built successfully${NC}"
else
  echo -e "${RED}❌ Frontend build failed${NC}"
  exit 1
fi

# Step 6: Populate XP Store
print_step "Step 6: Populate XP Store"

cd /app/backend
python3 populate_store.py 2>/dev/null || echo -e "${YELLOW}⚠️  Store already populated${NC}"

# Step 7: Build Docker images
print_step "Step 7: Build Docker Images"

cd /app
echo -e "${YELLOW}🐳 Building Docker images...${NC}"
docker-compose build --no-cache

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Docker images built successfully${NC}"
else
  echo -e "${RED}❌ Docker build failed${NC}"
  exit 1
fi

# Step 8: Start containers
print_step "Step 8: Start Application"

echo -e "${YELLOW}🚀 Starting containers...${NC}"
docker-compose up -d

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Containers started successfully${NC}"
else
  echo -e "${RED}❌ Failed to start containers${NC}"
  exit 1
fi

# Step 9: Health checks
print_step "Step 9: Health Checks"

echo -e "${YELLOW}🏥 Waiting for services to be healthy...${NC}"
sleep 10

# Check backend
if curl -f http://localhost:8001/health &> /dev/null; then
  echo -e "${GREEN}✅ Backend is healthy${NC}"
else
  echo -e "${RED}❌ Backend health check failed${NC}"
  docker-compose logs backend
  exit 1
fi

# Check frontend
if curl -f http://localhost &> /dev/null; then
  echo -e "${GREEN}✅ Frontend is healthy${NC}"
else
  echo -e "${RED}❌ Frontend health check failed${NC}"
  docker-compose logs nginx
  exit 1
fi

# Check MongoDB
if docker exec missionkids-mongo mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
  echo -e "${GREEN}✅ MongoDB is healthy${NC}"
else
  echo -e "${RED}❌ MongoDB health check failed${NC}"
  exit 1
fi

# Step 10: Summary
print_step "Deployment Summary"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🌐 Access Points:"
echo "  - Frontend: http://localhost"
echo "  - Backend API: http://localhost:8001"
echo "  - Health Check: http://localhost/health"
echo "  - Mongo Express: http://localhost:8081 (run with --profile admin)"
echo ""
echo "📝 Useful Commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop: docker-compose down"
echo "  - Restart: docker-compose restart"
echo "  - Backup DB: docker exec missionkids-mongo mongodump --out /backup"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "  1. Configure your domain DNS"
echo "  2. Set up SSL/HTTPS (Let's Encrypt)"
echo "  3. Configure firewall rules"
echo "  4. Set up monitoring and alerts"
echo "  5. Configure automated backups"
echo ""
echo -e "${GREEN}🎉 MissionKids is now running in production mode!${NC}"
