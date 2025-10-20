# Backend Dockerfile
FROM docker.m.daocloud.io/library/node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN pnpm build

# Expose port
EXPOSE 3001

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && pnpm start:prod"]