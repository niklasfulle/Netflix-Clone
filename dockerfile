FROM mwader/static-ffmpeg:8.1.2@sha256:33f770f812cbfc3de96c547157fc9faf8bd95a36481753439ffa761045167585 AS ffprobe

FROM node:22-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ffprobe /ffprobe /usr/local/bin/ffprobe

WORKDIR /netflix-clone

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies

COPY package.json yarn.lock ./
COPY vendor/brace-expansion-compat ./vendor/brace-expansion-compat

RUN corepack enable \
    && yarn install --frozen-lockfile

FROM base AS builder

ENV NODE_ENV=production

COPY --from=dependencies /netflix-clone/node_modules ./node_modules
COPY . .

RUN ./node_modules/.bin/prisma generate \
    && ./node_modules/.bin/next build

FROM base AS production-dependencies

ENV NODE_ENV=production

COPY package.json yarn.lock ./
COPY vendor/brace-expansion-compat ./vendor/brace-expansion-compat

RUN corepack enable \
    && yarn install --frozen-lockfile --production=true \
    && yarn cache clean

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000

RUN groupadd --gid 10001 netflix \
    && useradd --uid 10001 --gid netflix --no-create-home --shell /usr/sbin/nologin netflix

COPY --chown=10001:10001 --from=production-dependencies /netflix-clone/node_modules ./node_modules
COPY --chown=10001:10001 --from=builder /netflix-clone/node_modules/.prisma ./node_modules/.prisma
COPY --chown=10001:10001 --from=builder /netflix-clone/.next ./.next
COPY --chown=10001:10001 --from=builder /netflix-clone/public ./public
COPY --chown=10001:10001 --from=builder /netflix-clone/prisma ./prisma
COPY --chown=10001:10001 --from=builder /netflix-clone/scripts/seed-staging-catalog.js ./scripts/seed-staging-catalog.js
COPY --chown=10001:10001 --from=builder /netflix-clone/scripts/seed-staging-users.js ./scripts/seed-staging-users.js
COPY --chown=10001:10001 --from=builder /netflix-clone/package.json ./package.json
COPY --chown=10001:10001 --from=builder /netflix-clone/CHANGELOG.md ./CHANGELOG.md
COPY --chown=10001:10001 --from=builder /netflix-clone/next.config.js ./next.config.js

RUN mkdir -p logs .next/cache && chown -R 10001:10001 logs .next/cache

USER 10001:10001

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(response => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["./node_modules/.bin/next", "start"]
