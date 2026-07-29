FROM node:22-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

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

COPY --from=production-dependencies /netflix-clone/node_modules ./node_modules
COPY --from=builder /netflix-clone/.next ./.next
COPY --from=builder /netflix-clone/public ./public
COPY --from=builder /netflix-clone/prisma ./prisma
COPY --from=builder /netflix-clone/package.json ./package.json
COPY --from=builder /netflix-clone/CHANGELOG.md ./CHANGELOG.md
COPY --from=builder /netflix-clone/next.config.js ./next.config.js

RUN mkdir -p logs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(response => { if (!response.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["sh", "-c", "./node_modules/.bin/prisma db push && exec ./node_modules/.bin/next start"]
