FROM oven/bun:1.2.3-debian AS builder
WORKDIR /app

COPY . /app/
RUN bun install --frozen-lockfile

ENV NODE_ENV=production
RUN bun run build

FROM caddy:2.9.1-alpine
COPY --from=builder /app/dist/. /usr/share/caddy/
