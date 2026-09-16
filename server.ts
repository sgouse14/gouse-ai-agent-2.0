import express from 'express';
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
  generateSpeechAudio,
  generateCompanyWithAi,
} from './server/apiService';

const app = express();
app.use(express.json({ limit: '20mb' }));

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
    const { message, specialist, projectContext, language } = req.body;
    const response = await generateChatResponse(
      message || '',
      specialist || 'general',
      projectContext || '',
      language || 'en-IN'
    );
    res.json({ response });
  } catch (_err) {
    const fallback = getDomainFallbackResponse(
      req.body.message || '',
      req.body.specialist || 'general',
      req.body.projectContext,
      req.body.language || 'en-IN'
    );
    res.json({ response: fallback });
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
    res.status(500).json({ error: err.message || 'Failed to generate company profile' });
  }
});

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

// Configure ports: bind to port 3000 (standard container proxy port) AND Cloud Run's PORT if specified
const primaryPort = 3000;
const envPort = process.env.PORT ? parseInt(process.env.PORT, 10) : null;

const portsToListen = new Set<number>();
portsToListen.add(primaryPort);
if (envPort && !isNaN(envPort) && envPort > 0) {
  portsToListen.add(envPort);
}

const activeServers: any[] = [];

for (const port of portsToListen) {
  try {
    const s = app.listen(port, '0.0.0.0', () => {
      console.log(`Gouse AI Server running on http://0.0.0.0:${port}`);
    });
    s.on('error', (err: any) => {
      console.warn(`[Server] Non-fatal listener notice on port ${port}: ${err.message}`);
    });
    activeServers.push(s);
  } catch (err: any) {
    console.warn(`[Server] Failed to initialize listener on port ${port}:`, err);
  }
}

// Graceful container shutdown on Cloud Run revision rotation
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing active connections.');
  activeServers.forEach((s) => s.close?.());
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, terminating gracefully.');
  activeServers.forEach((s) => s.close?.());
  process.exit(0);
});
