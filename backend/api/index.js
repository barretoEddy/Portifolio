// api/index.js - Root endpoint para Vercel Serverless

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    message: 'Backend do Portfólio está rodando! (Vercel Serverless)',
    version: '1.0.0',
    environment: 'serverless',
    services: ['Gemini AI', 'Sanity CMS'],
    endpoints: [
      'GET /health - Status do servidor',
      'POST /api/gemini/generate - Proxy para Google Gemini (requer x-backend-api-key)',
      'POST /api/sanity/query - Proxy para Sanity Query (requer x-backend-api-key)',
      'POST /api/sanity/mutate - Proxy para Sanity Mutations (requer x-backend-api-key)'
    ],
    documentation: 'https://github.com/barretoEddy/Portifolio/tree/main/backend'
  });
};
