FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG APP_NAME
RUN npm run build:${APP_NAME}

# ── Production stage ──────────────────────────────────────────────

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD node dist/apps/${APP_NAME}/main.js
