FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies using the lockfile for reproducible builds.
COPY package.json bun.lock ./
RUN npm install --global bun     && bun install --frozen-lockfile

COPY . .
RUN bun run build     && chown -R node:node /app

USER node
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server.cjs"]
