import { Router } from 'express';
import {
  SaqlainVerificationService,
  isVerificationAdminRequest,
  isVerificationAgentRequest,
} from './saqlainVerificationService.ts';

export const saqlainVerificationRouter = Router();
const service = new SaqlainVerificationService();

function errorStatus(message: string): number {
  if (/not found/i.test(message)) return 404;
  if (/already exists/i.test(message)) return 409;
  if (/not configured/i.test(message)) return 503;
  if (/Only |does not match|Reviewer identity|evidence|sanitized|Invalid |in-progress|held chain/i.test(message)) return 400;
  return 500;
}

saqlainVerificationRouter.get('/chains', async (req, res) => {
  if (!isVerificationAdminRequest(req.header('authorization'))) return res.status(401).json({ error: 'Administrator authorization required.' });
  try { return res.json({ chains: await service.list() }); }
  catch (error) { const message = error instanceof Error ? error.message : 'Verification service unavailable.'; return res.status(errorStatus(message)).json({ error: message }); }
});

saqlainVerificationRouter.get('/chains/:chainId', async (req, res) => {
  if (!isVerificationAdminRequest(req.header('authorization'))) return res.status(401).json({ error: 'Administrator authorization required.' });
  try {
    const chain = await service.get(req.params.chainId);
    return chain ? res.json({ chain }) : res.status(404).json({ error: 'Verification chain not found.' });
  } catch (error) { const message = error instanceof Error ? error.message : 'Verification service unavailable.'; return res.status(errorStatus(message)).json({ error: message }); }
});

saqlainVerificationRouter.post('/chains', async (req, res) => {
  if (!isVerificationAdminRequest(req.header('authorization'))) return res.status(401).json({ error: 'Administrator authorization required.' });
  const { chainId, reportRef } = req.body ?? {};
  if (typeof chainId !== 'string' || typeof reportRef !== 'string' || !chainId.trim() || !reportRef.trim()) {
    return res.status(400).json({ error: 'chainId and reportRef are required.' });
  }
  try { return res.status(201).json({ chain: await service.create({ chainId, reportRef }) }); }
  catch (error) { const message = error instanceof Error ? error.message : 'Verification service unavailable.'; return res.status(errorStatus(message)).json({ error: message }); }
});

saqlainVerificationRouter.post('/chains/:chainId/reviews', async (req, res) => {
  const input = req.body ?? {};
  if (typeof input.reviewerId !== 'string' || !isVerificationAgentRequest(req.header('authorization'), input.reviewerId)) {
    return res.status(401).json({ error: 'Registered verification-agent credential required.' });
  }
  if (!Number.isInteger(input.order) || !['APPROVED', 'REVIEW_REQUIRED', 'REJECTED'].includes(input.verdict) ||
      !Array.isArray(input.evidenceRefs) || (input.notes !== undefined && typeof input.notes !== 'string')) {
    return res.status(400).json({ error: 'Invalid review payload.' });
  }
  try {
    const chain = await service.review(req.params.chainId, {
      order: input.order,
      reviewerId: input.reviewerId,
      verdict: input.verdict,
      evidenceRefs: input.evidenceRefs,
      notes: input.notes,
      externalEvidenceSanitized: input.externalEvidenceSanitized,
    });
    return res.json({ chain });
  } catch (error) { const message = error instanceof Error ? error.message : 'Verification service unavailable.'; return res.status(errorStatus(message)).json({ error: message }); }
});

saqlainVerificationRouter.post('/chains/:chainId/resume', async (req, res) => {
  if (!isVerificationAdminRequest(req.header('authorization'))) return res.status(401).json({ error: 'Administrator authorization required.' });
  try { return res.json({ chain: await service.resume(req.params.chainId) }); }
  catch (error) { const message = error instanceof Error ? error.message : 'Verification service unavailable.'; return res.status(errorStatus(message)).json({ error: message }); }
});
