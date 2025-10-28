# Multi-stage build for MissionKids

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package files
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile --production=false

# Copy frontend source
COPY frontend/ ./

# Build production bundle
RUN yarn build

# Stage 2: Backend Setup
FROM python:3.10-slim AS backend-builder
WORKDIR /app/backend

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Production Image
FROM python:3.10-slim
WORKDIR /app

# Install nginx and supervisor
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend
COPY --from=backend-builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy configuration files
COPY nginx-production.conf /etc/nginx/sites-available/default
COPY supervisord-production.conf /etc/supervisor/conf.d/supervisord.conf

# Create necessary directories
RUN mkdir -p /app/backend/uploads /var/log/supervisor

# Expose ports
EXPOSE 80 8001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
