import express from 'express';
import path from 'path';
import fs from 'fs';
import crmRouter from './server/crm/router';
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
app.use(express.json({ limit: '20mb' }));
app.use('/api/v1', crmRouter);
