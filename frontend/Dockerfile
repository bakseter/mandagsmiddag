# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

COPY --from=builder /app/dist ./dist

USER bun
EXPOSE 3000

CMD ["bunx", "serve", "dist", "-p", "3000"]