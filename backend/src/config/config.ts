import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  n8nDatabaseUrl: process.env.N8N_DATABASE_URL || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  ibgeApiBaseUrl: process.env.IBGE_API_BASE_URL || 'https://servicodados.ibge.gov.br/api/v3',
  logLevel: process.env.LOG_LEVEL || 'info',
};

export const validateConfig = () => {
  const requiredVars = ['DATABASE_URL'];
  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Avisar se GEMINI_API_KEY não estiver configurado
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY não configurado. Endpoints de IA estarão desabilitados.');
  }
  
  // Avisar se N8N_DATABASE_URL não estiver configurado
  if (!process.env.N8N_DATABASE_URL) {
    console.warn('⚠️  N8N_DATABASE_URL não configurado. Dados reais de corridas não estarão disponíveis.');
  }
};
