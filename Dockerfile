FROM node:current-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:current-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:current-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Install production dependencies that are needed at runtime
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --omit=dev && \
    npm cache clean --force

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]