// api/gemini/generate.js - Google Gemini endpoint para Vercel Serverless

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
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY não configurada no servidor'
      });
    }

    const { prompt, model = 'gemini-2.0-flash' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'O campo "prompt" é obrigatório'
      });
    }

    // Configurações padrão do Gemini (iguais ao frontend)
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos para conteúdo maior
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erro ao processar requisição Gemini',
      details: error.response?.data || error.message
    });
  }
};
