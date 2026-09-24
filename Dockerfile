# STAGE 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# everyting installed in this step
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

# STAGE 2: Production runtime
FROM node:20-alpine AS production 
WORKDIR /app

#install only production dependencies in the final image
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api-docs', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]

