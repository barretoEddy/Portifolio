// api/health.js - Health check endpoint para Vercel Serverless

module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'vercel-serverless',
    region: process.env.VERCEL_REGION || 'unknown'
  });
};
