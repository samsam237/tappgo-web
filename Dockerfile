# ===========================================
# TAPPPLUS WEB - MULTI-STAGE DOCKERFILE
# ===========================================

# Stage 1: Base
FROM node:18-alpine AS base

# Install dependencies needed for node-gyp
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Stage 3: Builder
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build arguments for build-time environment variables
# IMPORTANT: Ces variables doivent être passées comme --build-arg lors du build
# Dans Dokploy, configurez-les dans "Build Arguments" et non dans "Environment Variables"
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME=TappPlus
ARG NEXT_PUBLIC_APP_VERSION=1.0.0

# Set build-time env vars (NEXT_PUBLIC_* sont intégrées dans le bundle au build-time)
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION
ENV NODE_ENV=production

# Build Next.js application
RUN npm run build

# Stage 4: Production Runner
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with proper permissions
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5500

# Runtime environment variables
# Note: NEXT_PUBLIC_* variables ne peuvent pas être changées au runtime
# car elles sont intégrées dans le bundle JavaScript au build-time
ENV PORT=5500
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5500/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Next.js server
CMD ["node", "server.js"]

# Stage 5: Production (alias for runner - for Dokploy compatibility)
FROM runner AS production
