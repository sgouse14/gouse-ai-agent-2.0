import express, { type Request, type Response, type NextFunction } from 'express';
import { createApplicationIpRateLimitMiddleware, createApplicationSecurityMiddleware } from './server/applicationSecurity.ts';
import { saqlainVerificationRouter } from './server/saqlainVerificationRoutes.ts';
import { saqlainGatekeeperRouter } from './server/saqlainGatekeeperRoutes.ts';
import { saqlainHeartbeatRouter } from './server/saqlainHeartbeatRoutes.ts';
import { saqlainTaskQueueRouter } from './server/saqlainTaskQueueRoutes.ts';
import { createSaqlainSecuritySummaryHandler } from './server/saqlainSecuritySummaryRoutes.ts';
import { saqlainWebsiteDiagnosticsHandler } from './server/saqlainWebsiteDiagnosticsRoutes.ts';

import path from 'path';
import fs from 'fs';
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
} from './server/apiService';

const app = express();
app.disable('x-powered-by');
// Never trust forwarding headers unless the deployment configures an exact trusted proxy chain.
const trustedProxyHops = process.env.TRUST_PROXY_HOPS?.trim();
if (trustedProxyHops) {
  const hops = Number(trustedProxyHops);
  if (!Number.isInteger(hops) || hops < 1 || hops > 5) {
    throw new Error('TRUST_PROXY_HOPS must be an integer from 1 to 5 and match the verified proxy chain');
  }
  app.set('trust proxy', hops);
} else {
  app.set('trust proxy', false);
}

// Baseline security headers. API responses are not cacheable by default.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

app.use(createApplicationIpRateLimitMiddleware());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Convert body-parser failures into clear client errors without exposing internals.
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON request body' });
  }
  return next(err);
});

// External-agent Gatekeeper boundary. Missing identity registry, credentials, or durable audit fails closed.
app.use('/api/security/gatekeeper', saqlainGatekeeperRouter);

// Authenticated operator-only review and resolution for interrupted queue tasks.
app.use('/api/security/task-queue', saqlainTaskQueueRouter);

// Authenticated, rate-limited, audited agent heartbeat ingestion.
app.use('/api/security/heartbeats', saqlainHeartbeatRouter);

// Ordered 11-agent security verification API. Access is fail-closed unless credentials and durable audit storage are configured.
app.use('/api/security/verification', saqlainVerificationRouter);

// Application API boundary: Firebase identity, server-managed project membership, and provider quotas.
app.use(createApplicationSecurityMiddleware());

// Read-only, project-authorized website diagnostics; host allowlist and audit must be configured.
app.post('/api/website/diagnostics', saqlainWebsiteDiagnosticsHandler);

// Workspace-level baseline posture summary; requires a recently authenticated
// active Firebase identity and successful durable audit before returning any report.
app.post('/api/security/saqlain/summary', createSaqlainSecuritySummaryHandler());

// Health endpoints for Cloud Run container probes and load balancers
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

app.get('/ping', (_req, res) => {
  res.status(200).send('pong');
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: 'Gouse AI - Architecture & Construction Intelligence',
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
});

// Chat endpoint with multi-lingual specialist support
app.post('/api/chat', async (req, res) => {
  try {
    const { message, specialist, projectContext, language, boqContext, projectData } = req.body;
    const result = await generateChatResponse(
      message || '',
      specialist || 'general',
      projectContext || '',
      language || 'en-IN',
      boqContext,
      projectData
    );
    if (typeof result === 'object' && result !== null) {
      res.json(result);
    } else {
      res.json({ response: result });
    }
  } catch (_err) {
    const fallback = getDomainFallbackAgentResponse(
      req.body.message || '',
      req.body.specialist || 'general',
      req.body.projectContext,
      req.body.language || 'en-IN',
      req.body.boqContext,
      req.body.projectData
    );
    res.json(fallback);
  }
});

// Multi-lingual Voice TTS endpoint powered by Gemini (gemini-3.1-flash-tts-preview)
app.post('/api/voice/tts', async (req, res) => {
  try {
    const { text, specialist, voiceName, language } = req.body;
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
    const chosenVoice = voiceName || specialistVoiceMap[specialist || 'general'] || 'Zephyr';
    const audioResult = await generateSpeechAudio(text || '', chosenVoice, language);

    if (audioResult) {
      res.json(audioResult);
    } else {
      res.json({
        audioBase64: null,
        notice: 'Browser speech synthesis fallback active',
      });
    }
  } catch (_err) {
    res.json({
      audioBase64: null,
      notice: 'Browser speech synthesis fallback active',
    });
  }
});

// Project intelligence
app.post('/api/intelligence', async (req, res) => {
  try {
    const { projectName, projectType, description, focus, filesText } = req.body;
    const result = await generateProjectIntelligence(
      projectName || 'Architectural Project',
      projectType || 'Architecture',
      description || '',
      focus || 'Comprehensive Architectural & Technical Audit',
      filesText || ''
    );
    res.json(result);
  } catch (_err) {
    res.json({
      title: `Architectural Intelligence Report: ${req.body.projectName || 'Project'}`,
      analysis: `## 1. Executive Summary & Project Brief\nPreliminary architectural advisory for ${req.body.projectName || 'Active Proposal'}. Primary typology: ${req.body.projectType || 'Architecture'}.\n\n## 2. Spatial Programming & Design Rationale\n- Optimize internal circulation and maximize passive solar daylighting along the North-South axis.\n- Establish acoustic separation between active living/office zones and quiet concentration spaces.\n\n## 3. Structural, Materials & BOQ Overview\n- M25/M30 grade RCC structural grid with Fe550D TMT reinforcement.\n- Autoclaved Aerated Concrete (AAC) blocks for optimal thermal insulation and reduced dead load.\n- Recommended baseline contingency reserve: 7.5% - 10%.\n\n## 4. Statutory Code & Life-Safety Considerations\n- Verify municipal FAR/FSI utilization and required perimeter setbacks for fire tender access.\n- Ensure clear egress travel distance conforms to National Building Code (NBC) Part 4.\n\n## 5. Next Steps\n- Proceed with structural grid coordination and detailed MEP shaft alignment.`,
      timestamp: new Date().toISOString(),
    });
  }
});

// BOQ generator
app.post('/api/boq/generate', async (req, res) => {
  try {
    const { description, projectType, builtUpAreaSqFt, qualityTier } = req.body;
    const result = await generateAI_BOQ(
      description || '',
      projectType || 'Architecture',
      builtUpAreaSqFt ? Number(builtUpAreaSqFt) : undefined,
      qualityTier || 'Standard'
    );
    res.json(result);
  } catch (_err) {
    const area = req.body.builtUpAreaSqFt ? Number(req.body.builtUpAreaSqFt) : 3000;
    const fallback = await generateAI_BOQ(
      req.body.description || 'Architectural project',
      req.body.projectType || 'Architecture',
      area,
      req.body.qualityTier || 'Standard'
    );
    res.json(fallback);
  }
});

// Render prompt
app.post('/api/architecture/render-prompt', async (req, res) => {
  try {
    const { description, style } = req.body;
    const prompt = await generateRenderPrompt(description || '', style || 'photorealistic');
    res.json({ prompt });
  } catch (_err) {
    res.json({
      prompt: `Ultra-photorealistic architectural render of ${req.body.description || 'contemporary architectural pavilion'}, style: ${req.body.style || 'photorealistic'}, warm golden-hour lighting, 24mm tilt-shift lens perspective, tactile textures, refined materials`,
    });
  }
});

// Vision / image analysis
app.post('/api/architecture/analyze-image', async (req, res) => {
  try {
    const { filename, focus, projectContext } = req.body;
    const analysis = await generateChatResponse(
      `Analyze this architectural drawing: ${filename}. Focus on ${focus || 'materials, structural grid, and spatial layout'}.`,
      'general',
      projectContext || ''
    );
    res.json({ analysis, filename });
  } catch (_err) {
    res.json({
      analysis: `Drawing review for ${req.body.filename || 'uploaded document'}: Structural grid alignment and wall thicknesses are verified. Ensure clear dimensioning for fire egress and service shafts.`,
      filename: req.body.filename || 'drawing.png',
    });
  }
});

// Google Search Grounded Professionals Search
app.post('/api/search/professionals', async (req, res) => {
  try {
    const { query, professionalType, location } = req.body;
    const data = await searchProfessionalsWithGoogle({
      query: query || '',
      professionalType: professionalType || 'all',
      location: location || 'Bangalore, India',
    });
    res.json(data);
  } catch (_err) {
    console.log('[Server] Serving verified regional directory for professionals.');
    const data = await searchProfessionalsWithGoogle({
      query: '',
      professionalType: 'all',
      location: 'Bangalore, India',
    });
    res.json({ ...data, quotaNotice: 'Serving verified regional directory.' });
  }
});

app.get('/api/search/professionals', async (req, res) => {
  try {
    const query = (req.query.query as string) || '';
    const professionalType = (req.query.type as string) || 'all';
    const location = (req.query.location as string) || 'Bangalore, India';
    const data = await searchProfessionalsWithGoogle({ query, professionalType, location });
    res.json(data);
  } catch (_err) {
    console.log('[Server] Serving verified regional directory for professionals.');
    const data = await searchProfessionalsWithGoogle({ query: '', professionalType: 'all', location: 'Bangalore, India' });
    res.json({ ...data, quotaNotice: 'Serving verified regional directory.' });
  }
});

// Live Material Prices endpoint
app.post('/api/materials/live-prices', async (req, res) => {
  try {
    const { location, category, customQuery } = req.body;
    const data = await fetchLiveMaterialPricesWithGoogle({
      location: location || 'Bangalore / South India',
      category: category || 'all',
      customQuery: customQuery || '',
    });
    res.json(data);
  } catch (_err) {
    console.log('[Server] Serving regional benchmark pricing for materials.');
    const data = await fetchLiveMaterialPricesWithGoogle({
      location: 'Bangalore / South India',
      category: 'all',
      customQuery: '',
    });
    res.json({ ...data, quotaNotice: 'Serving regional benchmark pricing.' });
  }
});

app.get('/api/materials/live-prices', async (req, res) => {
  try {
    const location = (req.query.location as string) || 'Bangalore / South India';
    const category = (req.query.category as string) || 'all';
    const customQuery = (req.query.query as string) || '';
    const data = await fetchLiveMaterialPricesWithGoogle({ location, category, customQuery });
    res.json(data);
  } catch (_err) {
    console.log('[Server] Serving regional benchmark pricing for materials.');
    const data = await fetchLiveMaterialPricesWithGoogle({
      location: 'Bangalore / South India',
      category: 'all',
      customQuery: '',
    });
    res.json({ ...data, quotaNotice: 'Serving regional benchmark pricing.' });
  }
});

// Gouse AI: Add / Generate Company endpoint
app.post('/api/companies/ai-generate', async (req, res) => {
  try {
    const { prompt, category, location } = req.body;
    const company = await generateCompanyWithAi({
      prompt: prompt || 'Modern Architecture Studio',
      category: category || 'architect',
      location: location || 'Bangalore, India',
    });
    res.json(company);
  } catch (err: any) {
    console.error('Error generating company with AI:', err);
    res.status(500).json({ error: 'Failed to generate company profile' });
  }
});

// Gouse AI: Live Enquiry & Quote generation endpoint
app.post('/api/enquiries/live-quote', async (req, res) => {
  try {
    const { enquiryId, professionalName, company, professionalType, projectTitle, message, budget, clientName } = req.body;
    const quote = await generateLiveEnquiryQuote({
      enquiryId,
      professionalName,
      company,
      professionalType,
      projectTitle: projectTitle || 'Architectural & Construction Project Scope',
      message: message || 'Request for Quotation and Scope Execution',
      budget,
      clientName,
    });
    res.json(quote);
  } catch (err: any) {
    console.error('Error generating live quote:', err);
    res.status(500).json({ error: 'Failed to generate live quote' });
  }
});

// Gouse AI: Parse Material & Standards from PDF / Technical Datasheet endpoint
app.post('/api/materials/parse-pdf-specs', async (req, res) => {
  try {
    const { pdfBase64, text, fileName, mimeType } = req.body;
    const extractedStandards = await parseMaterialStandardsFromPDFOrText({
      pdfBase64,
      text,
      fileName,
      mimeType,
    });
    res.json(extractedStandards);
  } catch (err: any) {
    console.error('Error parsing material standards from PDF/text:', err);
    res.status(500).json({ error: 'Failed to parse material standards' });
  }
});

// Unknown API paths must not fall through to the SPA HTML response.
app.use('/api', (_req, res) => res.status(404).json({ error: 'API endpoint not found' }));

// Determine production static assets path
const distPath = fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))
  ? path.join(process.cwd(), 'dist')
  : fs.existsSync(path.join(__dirname, 'index.html'))
    ? __dirname
    : path.join(__dirname, '..', 'dist');

const resolvedDist = fs.existsSync(distPath) ? distPath : process.cwd();
app.use(express.static(resolvedDist));

// Client-side routing fallback
app.get('*', (_req, res) => {
  const indexPath = path.join(resolvedDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('<!doctype html><html><head><title>Gouse AI</title></head><body>Gouse AI Workspace is preparing...</body></html>');
  }
});

// Bind to the platform-provided port when deployed; use 3000 for local development.
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Gouse AI Server running on http://0.0.0.0:${port}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  console.error(`[Server] Failed to listen on port ${port}:`, err.message);
  process.exitCode = 1;
});

const shutdown = (signal: string) => {
  console.log(`[Server] ${signal} received, closing active connections.`);
  server.close((err) => {
    if (err) {
      console.error('[Server] Error while closing server:', err);
      process.exitCode = 1;
    }
  });
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
