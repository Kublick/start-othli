# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only package files first
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy .env for build-time environment variables
COPY .env ./

# Now copy the rest of the source
COPY . ./

# Build
RUN pnpm run build

# ---- Production Stage ----
FROM node:22-alpine AS runner

WORKDIR /app

# Copy only the built output and necessary files
COPY --from=builder /app/.output ./output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["node", "./output/server/index.mjs"] 