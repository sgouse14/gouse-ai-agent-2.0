import { defineConfig, loadEnv } from 'vite';
import { checkApplicationIpRateLimit, createApplicationApiAuthorizer } from './server/applicationSecurity';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {
  generateChatResponse,
  generateProjectIntelligence,
  generateAI_BOQ,
  generateRenderPrompt,
  searchProfessionalsWithGoogle,
  fetchLiveMaterialPricesWithGoogle,
  getDomainFallbackResponse,
  generateSpeechAudio,
  generateCompanyWithAi,
} from './server/apiService';

function getRequestBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    let failed = false;
    req.on('data', (chunk: any) => {
      if (failed) return;
      size += Buffer.byteLength(chunk);
      if (size > 5 * 1024 * 1024) {
        failed = true;
        const error: any = new Error('Request body is too large');
        error.statusCode = 413;
        reject(error);
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (failed) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        const error: any = new Error('Invalid JSON request body');
        error.statusCode = 400;
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: any, data: any, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function apiMiddlewarePlugin() {
  const authorizeApiRequest = createApplicationApiAuthorizer();
  return {
    name: 'gouse-ai-api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0];

        if (!url?.startsWith('/api/')) {
          return next();
        }

        try {
          const ipLimit = checkApplicationIpRateLimit(url, req.method, req.socket?.remoteAddress);
          if (!ipLimit.allowed) {
            if (ipLimit.retryAfterSeconds) res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
            return sendJson(res, { error: 'Request rate limit exceeded.' }, 429);
          }
          const authorization = await authorizeApiRequest({
            method: req.method,
            path: url,
            authorization: req.headers?.authorization,
            projectIdHeader: req.headers?.['x-project-id'],
            ipAddress: req.socket?.remoteAddress,
          });
          if (!authorization.allowed) {
            if (authorization.retryAfterSeconds) res.setHeader('Retry-After', String(authorization.retryAfterSeconds));
            return sendJson(res, { error: authorization.error || 'Application security check failed.' }, authorization.status || 503);
          }

          if (url === '/api/health') {
            return sendJson(res, {
              status: 'ok',
              agent: "ALVI's Architecture, Interior Designers & Construction - AI Intelligence",
              version: '3.8.0',
              model: 'gemini-3.8-flash',
              features: [
                'chat',
                'multilingual_voice',
                'tts_gemini',
                'intelligence',
                'boq_generator',
                'render_prompts',
                'marketplace',
                'materials',
              ],
            });
          }

          if (url === '/api/chat' && req.method === 'POST') {
            const body = await getRequestBody(req);
            try {
              const response = await generateChatResponse(
                body.message || '',
                body.specialist || 'general',
                body.projectContext || '',
                body.language || 'en-IN'
              );
              return sendJson(res, { response });
            } catch (_err) {
              const fallback = getDomainFallbackResponse(
                body.message || '',
                body.specialist || 'general',
                body.projectContext,
                body.language || 'en-IN'
              );
              return sendJson(res, { response: fallback });
            }
          }

          if (url === '/api/voice/tts' && req.method === 'POST') {
            const body = await getRequestBody(req);
            try {
              const specialistVoiceMap: Record<string, string> = {
                general: 'Zephyr',
                design: 'Puck',
                code: 'Charon',
                documentation: 'Fenrir',
                quantity: 'Kore',
                sustainability: 'Zephyr',
                structural: 'Fenrir',
                interior: 'Kore',
              };
              const chosenVoice =
                body.voiceName || specialistVoiceMap[body.specialist || 'general'] || 'Zephyr';
              const audioResult = await generateSpeechAudio(
                body.text || '',
                chosenVoice,
                body.language
              );
              if (audioResult) {
                return sendJson(res, audioResult);
              }
              return sendJson(res, {
                audioBase64: null,
                notice: 'Browser speech synthesis fallback active',
              });
            } catch (_err) {
              return sendJson(res, {
                audioBase64: null,
                notice: 'Browser speech synthesis fallback active',
              });
            }
          }

          if (url === '/api/intelligence' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const result = await generateProjectIntelligence(
              body.projectName || 'Architectural Project',
              body.projectType || 'Architecture',
              body.description || '',
              body.focus || 'Comprehensive Architectural & Technical Audit',
              body.filesText || ''
            );
            return sendJson(res, result);
          }

          if (url === '/api/boq/generate' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const result = await generateAI_BOQ(
              body.description || 'Standard residential building construction',
              body.projectType || 'Architecture'
            );
            return sendJson(res, result);
          }

          if (url === '/api/architecture/render-prompt' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const prompt = await generateRenderPrompt(
              body.description || 'Modern architectural pavilion',
              body.style || 'photorealistic'
            );
            return sendJson(res, { prompt });
          }

          if (url === '/api/architecture/analyze-image' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const response = await generateChatResponse(
              `Analyze this architectural drawing/render: ${body.filename || 'Drawing'}. Focus on ${body.focus || 'materials, structural grid, and spatial layout'}. Detail visible elements, drawing type, scale implications, and coordination flags.`,
              'general',
              body.projectContext || ''
            );
            return sendJson(res, { analysis: response, filename: body.filename });
          }

          if (url === '/api/search/professionals') {
            let params: any = {};
            if (req.method === 'POST') {
              params = await getRequestBody(req);
            } else {
              const parsedUrl = new URL(req.url, 'http://localhost:3000');
              params = {
                query: parsedUrl.searchParams.get('query') || '',
                professionalType: parsedUrl.searchParams.get('type') || 'all',
                location: parsedUrl.searchParams.get('location') || 'Bangalore, India',
              };
            }
            const data = await searchProfessionalsWithGoogle(params);
            return sendJson(res, data);
          }

          if (url === '/api/materials/live-prices') {
            let params: any = {};
            if (req.method === 'POST') {
              params = await getRequestBody(req);
            } else {
              const parsedUrl = new URL(req.url, 'http://localhost:3000');
              params = {
                location: parsedUrl.searchParams.get('location') || 'Bangalore / South India',
                category: parsedUrl.searchParams.get('category') || 'all',
                customQuery: parsedUrl.searchParams.get('query') || '',
              };
            }
            const data = await fetchLiveMaterialPricesWithGoogle(params);
            return sendJson(res, data);
          }

          if (url === '/api/companies/ai-generate' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const company = await generateCompanyWithAi({
              prompt: body.prompt || 'Modern Architecture Studio',
              category: body.category || 'architect',
              location: body.location || 'Bangalore, India',
            });
            return sendJson(res, company);
          }

          // Fallback for unhandled /api/ routes
          return sendJson(res, { error: 'Endpoint not found', url }, 404);
        } catch (err: any) {
          const status = err?.statusCode === 413 ? 413 : err?.statusCode === 400 ? 400 : 500;
          const message = status === 413 ? 'Request body is too large' : status === 400 ? 'Invalid JSON request body' : 'Internal Server Error';
          console.error('API middleware request failed with status', status);
          return sendJson(res, { error: message }, status);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const allowedHosts = (env.VITE_ALLOWED_HOSTS ?? process.env.VITE_ALLOWED_HOSTS ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
  return {
    plugins: [
      tailwindcss(),
      react(),
      apiMiddlewarePlugin(),
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: allowedHosts.length > 0 ? allowedHosts : undefined,
    },
  };
});
