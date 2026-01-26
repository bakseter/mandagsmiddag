FROM oven/bun:1-alpine AS builder

WORKDIR /app

ARG VITE_HOSTNAME=backend:8080
ENV VITE_HOSTNAME=$VITE_HOSTNAME

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build


FROM nginx:alpine

WORKDIR /app

RUN apk update && \
    apk upgrade --no-cache

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
