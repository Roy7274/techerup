# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

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
