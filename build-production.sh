#!/bin/bash

# Build Script for Production
echo "🚀 MissionKids - Production Build Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
  echo "⚠️  Please do not run as root"
  exit 1
fi

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Frontend Build
echo -e "${YELLOW}📦 Building Frontend...${NC}"
cd /app/frontend

# Clean previous build
rm -rf build/

# Build for production
yarn build

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend build successful${NC}"
else
  echo -e "${RED}❌ Frontend build failed${NC}"
  exit 1
fi

# Step 2: Optimize images
echo -e "${YELLOW}🖼️  Optimizing images...${NC}"
if command -v pngquant &> /dev/null; then
  find build/static -name "*.png" -exec pngquant --force --ext .png --quality=65-80 {} \;
  echo -e "${GREEN}✅ Images optimized${NC}"
else
  echo -e "${YELLOW}⚠️  pngquant not found, skipping image optimization${NC}"
fi

# Step 3: Generate build info
echo -e "${YELLOW}📝 Generating build info...${NC}"
cat > build/build-info.json << EOF
{
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0",
  "environment": "production"
}
EOF
echo -e "${GREEN}✅ Build info generated${NC}"

# Step 4: Calculate bundle size
echo -e "${YELLOW}📊 Build Statistics:${NC}"
echo "  Main bundle: $(du -sh build/static/js/main.*.js | cut -f1)"
echo "  CSS bundle: $(du -sh build/static/css/main.*.css 2>/dev/null | cut -f1 || echo 'N/A')"
echo "  Total build size: $(du -sh build | cut -f1)"

# Step 5: Backend check
echo -e "\n${YELLOW}🔧 Checking Backend...${NC}"
cd /app/backend

# Verify all dependencies
python3 -m pip check
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backend dependencies OK${NC}"
else
  echo -e "${RED}❌ Backend dependencies have conflicts${NC}"
  exit 1
fi

echo -e "\n${GREEN}🎉 Production build completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Review build output in /app/frontend/build/"
echo "2. Test the production build locally"
echo "3. Deploy to your server"
echo ""
