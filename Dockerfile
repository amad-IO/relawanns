# Multi-stage build for smaller image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy source files
COPY . .

# Build frontend (Vite)
RUN npm run build

# ============================================
# Production stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend from builder
COPY --from=builder /app/build ./build


# Copy backend functions
COPY netlify ./netlify

# Copy server file
COPY server.js ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]
