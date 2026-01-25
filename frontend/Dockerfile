# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

ARG VITE_HOSTNAME=backend:8080
ENV VITE_HOSTNAME=$VITE_HOSTNAME

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

RUN apk update && \
    apk upgrade --no-cache

COPY --from=builder /app/dist ./dist
USER bun
EXPOSE 3000

CMD ["bunx", "serve", "dist", "-p", "3000"]
