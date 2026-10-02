# ==============================================================================
# TECH7 Electronics — Production Dockerfile for Next.js 14.2.35
# Compatible with Hostinger VPS Docker Manager / Docker Compose
# ==============================================================================

# --- Stage 1: Base image ---
FROM node:20-alpine AS base

# Install libc6-compat for compatibility with native modules on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# --- Stage 2: Install dependencies ---
FROM base AS deps
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install dependencies strictly according to package-lock.json
RUN npm ci

# --- Stage 3: Build the application ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

# --- Stage 4: Production Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy runtime files and production node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data
COPY --from=builder /app/.next ./.next

# Ensure persistent directories exist for volumes
RUN mkdir -p /app/public/uploads /app/data

# Listen on port 3000
EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "start"]
