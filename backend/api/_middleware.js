// api/_middleware.js - Middleware helper para autenticação e CORS

function authenticateBackendKey(req) {
  const apiKey = req.headers['x-backend-api-key'];

  if (!apiKey) {
    return {
      error: 'API key não fornecida. Adicione o header x-backend-api-key',
      status: 401
    };
  }

  if (apiKey !== process.env.BACKEND_API_KEY) {
    return {
      error: 'API key inválida',
      status: 403
    };
  }

  return null; // Success
}

function setCorsHeaders(res, origin) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:4200'];

  // Se a origem está na lista permitida, adiciona nos headers
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-backend-api-key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

function handleCors(req, res) {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

module.exports = {
  authenticateBackendKey,
  setCorsHeaders,
  handleCors
};
