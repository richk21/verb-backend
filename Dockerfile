# STAGE 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Activates modern Yarn version via Corepack
RUN corepack enable

# Copy ALL project files first so Yarn 4 doesn't lose its environment configuration
COPY . .

# Install all dependencies (dev + production) using Yarn 4 rules
RUN yarn install --immutable

# Compile the source code into plain JavaScript files inside /dist
RUN yarn build

# STAGE 2: Production runtime
FROM node:20-alpine AS production 
WORKDIR /app

RUN corepack enable

# Copy manifest files and Yarn configuration keys into the clean stage
COPY package.json yarn.lock .yarnrc.yml* ./
COPY .yarn* ./.yarn*

# Install ONLY production dependencies in this final image layer
RUN yarn workspaces focus --production

# Bring over the compiled production code from the builder stage
COPY --from=builder /app/dist ./dist

# Drop root privileges for safety
USER node
EXPOSE 5000

# Continuous internal health monitoring
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api-docs', (r) => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

# Boot command
CMD ["node", "dist/index.js"]
