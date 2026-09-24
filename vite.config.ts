import { defineConfig } from 'vite';
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
          if (url === '/api/contact') {
            return sendJson(res, {
              name: 'Ar. S. Gouse',
              role: 'Chief Architect & Director',
              phone: '+91 8073947241',
              rawPhone: '8073947241',
              whatsapp: '+918073947241',
              whatsappUrl: 'https://wa.me/918073947241',
              email: 'sgouse14@gmail.com',
              company: 'Gouse AI Architecture & UrbanNest Co-Living',
              location: 'Bangalore, Karnataka, India',
            });
          }

          if (url === '/api/health') {
            return sendJson(res, {
              status: 'ok',
              agent: "ALVI's Architecture, Interior Designers & Construction - AI Intelligence",
              owner: 'Ar. S. Gouse',
              phone: '+91 8073947241',
              whatsapp: '+918073947241',
              email: 'sgouse14@gmail.com',
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
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
