FROM node:22-bookworm-slim AS build
WORKDIR /app

# Bun consumes the checked-in lockfile for reproducible dependency installation.
COPY package.json bun.lock ./
RUN npm install --global bun && bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app

RUN npm install --global bun
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist
RUN chown -R node:node /app

USER node
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
