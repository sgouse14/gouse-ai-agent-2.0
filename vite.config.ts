import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import {
  generateChatResponse,
  generateProjectIntelligence,
  generateAI_BOQ,
  generateRenderPrompt,
} from './server/apiService';

function getRequestBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: any, data: any, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function apiMiddlewarePlugin() {
  return {
    name: 'gouse-ai-api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0];

        if (!url?.startsWith('/api/')) {
          return next();
        }

        try {
          if (url === '/api/health') {
            return sendJson(res, {
              status: 'ok',
              agent: 'Gouse AI Architecture Intelligence',
              version: '3.8.0',
              model: 'gemini-3.8-flash',
              features: ['chat', 'intelligence', 'boq_generator', 'render_prompts', 'marketplace', 'materials']
            });
          }

          if (url === '/api/chat' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const response = await generateChatResponse(
              body.message || '',
              body.specialist || 'general',
              body.projectContext || ''
            );
            return sendJson(res, { response });
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

          // Fallback for unhandled /api/ routes
          return sendJson(res, { error: 'Endpoint not found', url }, 404);
        } catch (err: any) {
          console.error('API middleware error:', err);
          return sendJson(res, { error: err.message || 'Internal Server Error' }, 500);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    apiMiddlewarePlugin(),
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
});
