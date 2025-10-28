#!/bin/bash

# Quick Start Script for Local Development

echo "🚀 MissionKids - Quick Start"
echo "============================"
echo ""

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed. Aborting." >&2; exit 1; }

echo "✅ Prerequisites met"
echo ""

# Create .env if doesn't exist
if [ ! -f ".env.production" ]; then
    echo "📝 Creating .env.production..."
    cp .env.production.example .env.production 2>/dev/null || cat > .env.production << EOF
MONGO_URL=mongodb://mongo:27017
DB_NAME=missionkids
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGINS=*
EOF
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

# Check health
if curl -f http://localhost/health &> /dev/null; then
    echo "✅ Application is running!"
    echo ""
    echo "📱 Access the app:"
    echo "   Frontend: http://localhost"
    echo "   Backend:  http://localhost:8001"
    echo "   Health:   http://localhost/health"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop:"
    echo "   docker-compose down"
else
    echo "❌ Health check failed. Check logs:"
    echo "   docker-compose logs"
fi
