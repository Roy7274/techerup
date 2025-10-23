# Frontend Dockerfile
FROM docker.m.daocloud.io/library/node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV ESLINT_NO_DEV_ERRORS=true
ENV NEXT_LINT=false
ENV SKIP_TYPE_CHECK=true
RUN pnpm build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]