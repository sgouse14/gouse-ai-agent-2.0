import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  generateChatResponse,
  generateProjectIntelligence,
  generateAI_BOQ,
  generateRenderPrompt,
} from './server/apiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    agent: 'Gouse AI Architecture Intelligence',
    version: '3.8.0',
    model: 'gemini-3.8-flash',
    environment: 'production'
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, specialist, projectContext } = req.body;
    const response = await generateChatResponse(
      message || '',
      specialist || 'general',
      projectContext || ''
    );
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BOQ generator
app.post('/api/boq/generate', async (req, res) => {
  try {
    const { description, projectType } = req.body;
    const result = await generateAI_BOQ(description || '', projectType || 'Architecture');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Render prompt
app.post('/api/architecture/render-prompt', async (req, res) => {
  try {
    const { description, style } = req.body;
    const prompt = await generateRenderPrompt(description || '', style || 'photorealistic');
    res.json({ prompt });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Client-side routing fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gouse AI Server running on http://0.0.0.0:${PORT}`);
});
