FROM oven/bun:1.2.3-debian AS builder
WORKDIR /app

COPY . /app/
RUN rm bun.lock package-lock.json
RUN bun install

ARG BACKEND_URL
ENV VITE_BACKEND_URL=$BACKEND_URL

ENV NODE_ENV=production
RUN bun run build

FROM caddy:2.9.1-alpine
COPY --from=builder /app/dist/. /usr/share/caddy/
COPY Caddyfile /etc/caddy/Caddyfile
