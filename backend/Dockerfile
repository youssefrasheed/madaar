# ─── SocialHub Backend Dockerfile ────────────────────────────
FROM node:20-alpine

# Install sqlite3 cli tool for our lightweight native adapter
RUN apk add --no-cache sqlite

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code
COPY . .

# Ensure data and uploads directories exist with proper permissions
RUN mkdir -p data uploads

# Expose API port
EXPOSE 3001

# Start the server
CMD ["node", "src/index.js"]
