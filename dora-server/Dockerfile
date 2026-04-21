# ---------- Build stage ----------
    FROM node:24-alpine AS builder

    WORKDIR /app
    RUN corepack enable
    
    COPY package.json pnpm-lock.yaml ./
    RUN pnpm install --frozen-lockfile
    
    COPY . .
    RUN pnpm run build
    
    
    # ---------- Runtime stage ----------
    FROM node:24-alpine
    
    WORKDIR /app
    RUN corepack enable
    
    ENV NODE_ENV=production
    ENV PORT=5173
    
    COPY --from=builder /app/build ./build
    COPY --from=builder /app/package.json ./
    COPY --from=builder /app/node_modules ./node_modules
    
    EXPOSE 5173
    
    CMD ["node", "build"]