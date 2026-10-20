# Gouse AI Agent 2.0

Architecture and construction intelligence workspace built with React, TypeScript, Vite, Express, and Google's Gemini API.

> The active application in this repository is the React/Vite frontend with an Express API server. Some older Python/FastAPI notes may exist in the history; use the Node toolchain below for the current application.

## Features

- Architecture and construction specialist chat
- BOQ and project-intelligence workflows
- Material-price and professional-search integrations
- Voice processing and translation endpoints
- Construction-site image review
- React browser workspace
- Express API with health endpoints

## Requirements

- Node.js 20 or newer (use a currently supported LTS release)
- npm or Bun
- Gemini API key for AI-backed features

## Quick start

```bash
npm install
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

Add your `GEMINI_API_KEY` to `.env`. Optional provider variables should only be configured when the corresponding integration is enabled. Never commit `.env` or API credentials.

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000.

## Quality checks

```bash
npm run lint
npm run build
```

The production build creates the frontend assets and bundles the Express server to `dist/server.cjs`. Start the production server with:

```bash
npm start
```

## Docker

The Docker image uses the same Node/Vite/Express stack as the application. Configure the required environment variables at runtime; do not bake secrets into the image.

```bash
docker build -t gouse-ai-agent .
docker run --rm -p 3000:3000 --env-file .env gouse-ai-agent
```

The server listens on the platform-provided `PORT` when set, or port 3000 locally.

## Health checks

- `GET /healthz`
- `GET /ping`
- `GET /api/health`

## Project layout

- `src/` — React application and UI components
- `server.ts` — Express production API server
- `server/apiService.ts` — AI and domain service integrations
- `vite.config.ts` — development API middleware and Vite configuration
- `public/` — public assets and web manifest

## Security and operational notes

- Keep API keys in environment variables or your deployment secret manager.
- Treat AI-generated design guidance, quantity estimates, material prices, code interpretations, and site observations as advisory until reviewed by a qualified professional.
- Verify current statutory requirements with the relevant official authority for the project's jurisdiction.
- The health endpoints indicate process availability; they do not verify every external AI provider or integration.

## Architecture direction

See [ARCHAGENT.md](ARCHAGENT.md) for the architecture-first product mission and specialist workflow.
