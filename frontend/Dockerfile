# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Vouch frontend: Vite/React SPA built then served by nginx.
#
#   build  - tsc -b && vite build -> dist/ (static assets)
#             VITE_* vars are compile-time in Vite, so they're passed as
#             ARG/ENV here instead of being read at runtime.
#   nginx  - serves dist/ and falls back to /index.html for client-side
#             routing (React Router pages like /c/:slug and /:user/r/:token).
# ---------------------------------------------------------------------------

FROM node:24-slim AS build
WORKDIR /app

# Build-time env (Vite inlines these). Defaults keep a sandbox build working.
ARG VITE_API_ORIGIN=""
ARG VITE_API_BASE="/api/v1"
ARG VITE_PADDLE_ENV="sandbox"
ARG VITE_PADDLE_CLIENT_TOKEN=""
ENV VITE_API_ORIGIN=$VITE_API_ORIGIN
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_PADDLE_ENV=$VITE_PADDLE_ENV
ENV VITE_PADDLE_CLIENT_TOKEN=$VITE_PADDLE_CLIENT_TOKEN

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]