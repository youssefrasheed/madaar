#!/bin/bash
# ==============================================================================
# Madaar Platform Subdomain Automated Deployment & Update Script
# ==============================================================================

set -e

echo "🚀 [1/4] Starting Madaar Deployment..."

# 1. Backend Dependencies & Migration
echo "📦 [2/4] Installing backend dependencies..."
cd backend
npm install --omit=dev --no-audit

# 2. Frontend Build
echo "⚡ [3/4] Building production frontend with Vite..."
cd ../frontend
npm install --no-audit
npm run build

cd ..

# 3. Process Manager Restart (PM2)
echo "🔄 [4/4] Reloading PM2 backend service..."
if command -v pm2 > /dev/null; then
    pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
    pm2 save
    echo "✅ PM2 process reloaded successfully!"
else
    echo "⚠️ PM2 not found globally. You can install it via: npm install -g pm2"
fi

echo "=============================================================================="
echo "🎉 Deployment completed successfully!"
echo "📡 Backend is running on port 3001"
echo "🌐 Frontend static build is ready in: ./frontend/dist"
echo "=============================================================================="
