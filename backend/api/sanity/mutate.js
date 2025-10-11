// api/sanity/mutate.js - Sanity Mutation endpoint para Vercel Serverless

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
    if (!process.env.SANITY_TOKEN) {
      return res.status(500).json({
        error: 'SANITY_TOKEN não configurado no servidor'
      });
    }

    if (!process.env.SANITY_PROJECT_ID) {
      return res.status(500).json({
        error: 'SANITY_PROJECT_ID não configurado no servidor'
      });
    }

    const { mutations } = req.body;
    const dataset = process.env.SANITY_DATASET || 'production';

    if (!mutations || !Array.isArray(mutations)) {
      return res.status(400).json({
        error: 'O campo "mutations" é obrigatório e deve ser um array'
      });
    }

    if (mutations.length === 0) {
      return res.status(400).json({
        error: 'Array de mutations não pode estar vazio'
      });
    }

    console.log('Tentando criar documento no Sanity:', {
      projectId: process.env.SANITY_PROJECT_ID,
      dataset,
      mutations: mutations.length,
      hasToken: !!process.env.SANITY_TOKEN
    });

    const response = await axios.post(
      `https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/mutate/${dataset}`,
      {
        mutations: mutations
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.SANITY_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('Resposta do Sanity:', response.data);

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Erro ao chamar Sanity Mutate:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    let errorMessage = 'Erro ao processar mutation no Sanity';
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;

      // Erros específicos do Sanity
      if (error.response.status === 401) {
        errorMessage = 'Token do Sanity inválido ou expirado';
      } else if (error.response.status === 403) {
        errorMessage = 'Sem permissão para criar documentos no Sanity';
      } else if (error.response.status === 400) {
        errorMessage = `Dados inválidos: ${error.response.data?.error || 'Verifique os dados enviados'}`;
      }
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.response?.data || error.message,
      mutations: req.body.mutations // Para debug
    });
  }
};
