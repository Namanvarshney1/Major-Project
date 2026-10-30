import { Router } from 'express';
import { isRealDbConnected, getDb } from '../db/mongodb.js';
import { config } from '../config.js';

const router = Router();

router.get(['/health', '/api/v1/health'], async (req, res) => {
  const isReal = isRealDbConnected();
  let pythonStatus = 'unknown';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const pRes = await fetch(`${config.pythonAiServiceUrl}/internal/ai/health`, { signal: controller.signal });
    clearTimeout(timeout);
    pythonStatus = pRes.ok ? 'connected' : `http_${pRes.status}`;
  } catch {
    pythonStatus = 'offline_or_unreachable';
  }

  res.json({
    status: isReal ? 'healthy' : 'degraded',
    service: 'PrepPulse (Node.js + Express + JavaScript)',
    version: '1.0.0',
    database: isReal ? 'connected' : 'mock_in_memory',
    database_name: config.mongodbDatabase,
    python_ai_service: pythonStatus,
    groq_configured: Boolean(config.groqApiKey),
    model: config.groqModel,
  });
});

router.get(['/health/db', '/api/v1/health/db'], async (req, res) => {
  const isReal = isRealDbConnected();
  let pingResult = null;
  let success = false;

  try {
    const db = getDb();
    if (isReal && db.command) {
      pingResult = await db.command({ ping: 1 });
      success = true;
    } else {
      success = true;
      pingResult = { ok: 1, mock: true };
    }
  } catch (err) {
    pingResult = { error: err.message };
  }

  res.json({
    success,
    database_name: config.mongodbDatabase,
    ping_result: pingResult,
    is_mock: !isReal,
  });
});

export default router;

