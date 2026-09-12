# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Vouch API + workers (shared image, different commands)
#
#   api     -> CMD ["node", "dist/index.js"]              (Express backend)
#   worker  -> CMD ["node", "dist/workers/index.js"]      (combined BullMQ)
#
# What each phase does and why:
#   node:24-slim  - runtime image; matches local Node v24, ships glibc/openssl
#                   so Prisma + ffmpeg binaries run without build tools.
#   npm ci        - installs exactly what package-lock.json declares (reproducible).
#   prisma generate - emits the Prisma client BEFORE tsc runs; src imports it
#                   via "@prisma/client" and tsc needs the .d.ts present.
#   tsc (npm run build) - compiles src/ -> dist/ (CommonJS per tsconfig).
# ---------------------------------------------------------------------------

FROM node:24-slim AS deps
WORKDIR /app

# prisma.config.ts reads DATABASE_URL at import time (migration runner).
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL

COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

FROM node:24-slim AS build
WORKDIR /app

ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=$DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:24-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY package.json ./

# App listens on PORT from env (default 3000).
EXPOSE 3000

CMD ["node", "dist/index.js"]