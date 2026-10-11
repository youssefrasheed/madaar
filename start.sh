#!/bin/bash

# SocialHub — Start Script
# Runs both Backend (port 3001) and Frontend (port 5173)

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=================================================="
echo "🚀 Starting SocialHub Platform..."
echo "=================================================="

# Create .env if not exists
if [ ! -f "$DIR/backend/.env" ]; then
  cp "$DIR/backend/.env.example" "$DIR/backend/.env"
  echo "📄 Created backend/.env from .env.example"
fi

# Cleanup on exit
trap 'kill 0' EXIT

echo "📡 Starting Backend API on http://localhost:3001..."
(cd "$DIR/backend" && npm run dev) &

echo "🎨 Starting Frontend on http://localhost:5173..."
(cd "$DIR/frontend" && npm run dev) &

echo "=================================================="
echo "✨ SocialHub is ready!"
echo "👉 Open: http://localhost:5173"
echo "👤 Demo User: demo@socialhub.com / password123"
echo "=================================================="

wait
