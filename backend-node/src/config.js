import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env file in root or backend or local
const rootEnv = path.resolve(__dirname, '../../.env');
const backendEnv = path.resolve(__dirname, '../../backend/.env');
const localEnv = path.resolve(__dirname, '../.env');

if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
} else if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else {
  dotenv.config();
}

export const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  environment: process.env.ENVIRONMENT || 'development',
  jwtSecret: process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'preppulse-super-secure-production-jwt-secret-key-32chars-min!',
  jwtExpiresIn: process.env.ACCESS_TOKEN_EXPIRE_MINUTES ? `${process.env.ACCESS_TOKEN_EXPIRE_MINUTES}m` : '120m',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
  mongodbDatabase: process.env.MONGODB_DATABASE || 'preppulse_db',
  allowMockDb: process.env.ALLOW_MOCK_DB === 'true',
  pythonAiServiceUrl: process.env.PYTHON_AI_SERVICE_URL || `http://127.0.0.1:${process.env.AI_SERVICE_PORT || process.env.PYTHON_PORT || '8001'}`,
  internalServiceSecret: process.env.INTERNAL_SERVICE_SECRET || process.env.AI_SERVICE_SECRET || 'preppulse-internal-ai-service-secret-token-key-32chars',
  corsOrigins: (process.env.FRONTEND_ORIGINS || process.env.BACKEND_CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
};

