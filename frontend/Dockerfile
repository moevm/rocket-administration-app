FROM oven/bun:1.2.3-debian AS base
WORKDIR /app
COPY . /app/
RUN rm -f bun.lock package-lock.json || true
RUN bun install

FROM base AS development
EXPOSE 5173
CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS builder
ARG BACKEND_URL
ENV VITE_BACKEND_URL=$BACKEND_URL
ENV NODE_ENV=production
RUN bun run build

FROM caddy:2.9.1-alpine AS production
COPY --from=builder /app/dist/. /usr/share/caddy/
COPY Caddyfile /etc/caddy/Caddyfile