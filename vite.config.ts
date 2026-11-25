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
  getDomainFallbackAgentResponse,
  generateSpeechAudio,
  generateCompanyWithAi,
  generateLiveEnquiryQuote,
  parseMaterialStandardsFromPDFOrText,
  translateArchitecturalText,
  generateMaterialPriceAlerts,
  processVoiceCommandWithGemini,
  processAudioWithGemini,
  processNaturalVoiceChat,
  analyzeConstructionSiteVisualAudit,
  generateProjectBriefWithAi,
  generateMediaPostDraft,
  generateMediaAdKit,
} from './server/apiService';
import { runSuperAgentOrchestration } from './server/superAgentService';

function getRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
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
    req.on('error', () => resolve({}));
    if (typeof req.resume === 'function') {
      req.resume();
    }
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
              agent: 'Gouse AI - Architecture & Construction Intelligence',
              owner: 'Ar. S. Gouse',
              phone: '+91 8073947241',
              whatsapp: '+918073947241',
              email: 'sgouse14@gmail.com',
              version: '4.0.0',
              model: 'gemini-4-hydrogen',
              models: ['gemini-4-hydrogen', 'gemini-3.8-flash-lite-tts'],
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
            const selectedEngine = (body.engine || body.aiEngine || 'gemini') as 'gemini' | 'hydrogen' | 'chatgpt' | 'hybrid';
            try {
              const result = await generateChatResponse(
                body.message || '',
                body.specialist || 'general',
                body.projectContext || '',
                body.language || 'en-IN',
                body.boqContext,
                body.projectData,
                selectedEngine
              );
              if (typeof result === 'object' && result !== null) {
                return sendJson(res, result);
              }
              return sendJson(res, { response: result });
            } catch (_err) {
              const fallback = getDomainFallbackAgentResponse(
                body.message || '',
                body.specialist || 'general',
                body.projectContext,
                body.language || 'en-IN',
                body.boqContext,
                body.projectData,
                selectedEngine
              );
              return sendJson(res, fallback);
            }
          }

          if (url === '/api/agent/super-run' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const result = await runSuperAgentOrchestration({
              objective: body.objective || 'Run complete project audit and cost optimization',
              mode: body.mode || 'auto_orchestrate',
              projectData: body.projectData,
              boqItems: body.boqItems,
              language: body.language || 'en-IN',
              useLiveMarketData: body.useLiveMarketData !== false,
              attachment: body.attachment,
            });
            return sendJson(res, result);
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

          if (url === '/api/voice/process-command' && req.method === 'POST') {
            const body = await getRequestBody(req);
            try {
              const result = await processVoiceCommandWithGemini(body);
              return sendJson(res, result);
            } catch (err: any) {
              return sendJson(res, { error: 'Failed to process voice command', details: err?.message }, 500);
            }
          }

          if (url === '/api/voice/gemini-audio' && req.method === 'POST') {
            const body = await getRequestBody(req);
            try {
              const result = await processAudioWithGemini(body);
              return sendJson(res, result);
            } catch (err: any) {
              return sendJson(res, { error: 'Failed to process voice audio', details: err?.message }, 500);
            }
          }

          if (url === '/api/voice/natural-chat' && req.method === 'POST') {
            const body = await getRequestBody(req);
            try {
              const result = await processNaturalVoiceChat(body || {});
              return sendJson(res, result);
            } catch (err: any) {
              return sendJson(res, { error: 'Failed to process natural voice chat', details: err?.message }, 500);
            }
          }

          if (url === '/api/projects/ai-brief' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const result = await generateProjectBriefWithAi(body || {});
            return sendJson(res, result);
          }

          if (url === '/api/media/generate-post' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const result = await generateMediaPostDraft(body || {});
            return sendJson(res, result);
          }

          if (url === '/api/media/generate-ad-kit' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const result = await generateMediaAdKit(body || {});
            return sendJson(res, result);
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
            try {
              const result = await generateAI_BOQ(
                body.description || 'Standard residential building construction',
                body.projectType || 'Architecture',
                body.builtUpAreaSqFt ? Number(body.builtUpAreaSqFt) : undefined,
                body.qualityTier || 'Standard',
                body.image,
                body.mimeType,
                body.model || 'gemini-4-hydrogen'
              );
              return sendJson(res, result);
            } catch (_err) {
              const area = body.builtUpAreaSqFt ? Number(body.builtUpAreaSqFt) : 3000;
              const fallback = await generateAI_BOQ(
                body.description || 'Architectural project',
                body.projectType || 'Architecture',
                area,
                body.qualityTier || 'Standard',
                body.image,
                body.mimeType,
                body.model || 'gemini-4-hydrogen'
              );
              return sendJson(res, fallback);
            }
          }

          if (url === '/api/translate' && req.method === 'POST') {
            const body = await getRequestBody(req);
            try {
              const result = await translateArchitecturalText(
                body.text || '',
                body.targetLanguage || 'kn-IN',
                body.sourceLanguage || 'auto'
              );
              return sendJson(res, result);
            } catch (_err) {
              return sendJson(res, {
                error: 'Failed to translate',
                translatedText: body?.text || '',
                targetLanguage: body?.targetLanguage || 'kn-IN',
              }, 500);
            }
          }

          if (url === '/api/materials/radar-alerts' && req.method === 'POST') {
            const body = await getRequestBody(req);
            try {
              const alerts = await generateMaterialPriceAlerts(body.projectData);
              return sendJson(res, { alerts, timestamp: new Date().toISOString() });
            } catch (_err) {
              return sendJson(res, { error: 'Failed to generate price alerts' }, 500);
            }
          }

          if (url === '/api/enquiries/live-quote' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const quote = await generateLiveEnquiryQuote({
              enquiryId: body.enquiryId,
              professionalName: body.professionalName,
              company: body.company,
              professionalType: body.professionalType,
              projectTitle: body.projectTitle || 'Architectural & Construction Project Scope',
              message: body.message || 'Request for Quotation and Scope Execution',
              budget: body.budget,
              clientName: body.clientName,
            });
            return sendJson(res, quote);
          }

          if (url === '/api/materials/parse-pdf-specs' && req.method === 'POST') {
            const body = await getRequestBody(req);
            const extractedStandards = await parseMaterialStandardsFromPDFOrText({
              pdfBase64: body.pdfBase64,
              text: body.text,
              fileName: body.fileName,
              mimeType: body.mimeType,
            });
            return sendJson(res, extractedStandards);
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
            const photoData = body.image || body.imageBase64;
            const auditResult = await analyzeConstructionSiteVisualAudit({
              image: photoData,
              mimeType: body.mimeType,
              filename: body.filename || 'site_visit_capture.jpg',
              focus: body.focus || 'structural progress, RCC framing, rebar binding, masonry alignment, safety compliance',
              projectName: body.projectName || 'Gouse AI Active Site',
              projectType: body.projectType || 'Residential / Commercial',
              projectContext: body.projectContext || 'Bangalore, Karnataka',
              zoneFloor: body.zoneFloor,
              gpsCoordinates: body.gpsCoordinates,
              inspectorName: body.inspectorName,
            });
            return sendJson(res, {
              ...auditResult,
              analysis: auditResult.rawAnalysis || auditResult.summary,
              filename: auditResult.filename,
            });
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
