FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies (including dev for build)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy backend source
COPY backend/ ./

# Expose port
EXPOSE 3001

# Start server with tsx (no build needed)
CMD ["npx", "tsx", "src/server.ts"]
