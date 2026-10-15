# Backend image: NestJS API on Node LTS.
#
# Multi-stage so the runtime image carries only production dependencies.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` installs exactly what the lockfile pins.
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Production dependencies only — no CLI, no test tooling.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Run as the unprivileged user that the node image already provides.
USER node

EXPOSE 3000

# Secrets and the database URL arrive from the environment at run time; nothing
# is baked into the image.
CMD ["node", "dist/main.js"]
