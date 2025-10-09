// api/sanity/mutate.js - Sanity Mutations endpoint para Vercel Serverless

const axios = require('axios');
const { authenticateBackendKey, handleCors } = require('../_middleware');

module.exports = async (req, res) => {
  // Handle CORS
  if (handleCors(req, res)) return;

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  // Authenticate
  const authError = authenticateBackendKey(req);
  if (authError) {
    return res.status(authError.status).json({ error: authError.error });
  }

  try {
    if (!process.env.SANITY_TOKEN || !process.env.SANITY_PROJECT_ID) {
      return res.status(500).json({
        error: 'SANITY_TOKEN ou SANITY_PROJECT_ID não configurados no servidor'
      });
    }

    const { mutations } = req.body;
    const dataset = process.env.SANITY_DATASET || 'production';

    if (!mutations || !Array.isArray(mutations)) {
      return res.status(400).json({
        error: 'O campo "mutations" é obrigatório e deve ser um array'
      });
    }

    const response = await axios.post(
      `https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/mutate/${dataset}`,
      { mutations },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SANITY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Erro ao chamar Sanity Mutate:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erro ao processar requisição Sanity Mutate',
      details: error.response?.data || error.message
    });
  }
};
