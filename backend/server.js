require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// MIDDLEWARE DE SEGURANÇA
// ========================================

// Helmet adiciona headers de segurança
app.use(helmet());

// CORS - permite requisições do frontend
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:4200'];

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida pelo CORS'));
    }
  },
  credentials: true
}));

// Parse JSON
app.use(express.json());

// Rate limiting - máximo 100 requisições por 15 minutos por IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use(limiter);

// ========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ========================================

function authenticateBackendKey(req, res, next) {
  const apiKey = req.headers['x-backend-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key não fornecida. Adicione o header x-backend-api-key'
    });
  }

  if (apiKey !== process.env.BACKEND_API_KEY) {
    return res.status(403).json({
      error: 'API key inválida'
    });
  }

  next();
}

// ========================================
// ROTAS PÚBLICAS (SEM AUTENTICAÇÃO)
// ========================================

app.get('/', (req, res) => {
  res.json({
    message: 'Backend do Portfólio está rodando!',
    version: '1.0.0',
    services: ['Gemini AI', 'Sanity CMS'],
    endpoints: [
      'GET /health - Status do servidor',
      'POST /api/gemini/generate - Proxy para Google Gemini (requer x-backend-api-key)',
      'POST /api/sanity/query - Proxy para Sanity (requer x-backend-api-key)',
      'POST /api/sanity/mutate - Proxy para Sanity Mutations (requer x-backend-api-key)'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ========================================
// ROTAS PROTEGIDAS (REQUEREM API KEY)
// ========================================

// Proxy para Google Gemini
app.post('/api/gemini/generate', authenticateBackendKey, async (req, res) => {
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

    // Configurações padrão do Gemini
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
        timeout: 30000
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erro ao processar requisição Gemini',
      details: error.response?.data || error.message
    });
  }
});

// Proxy para Sanity - Query (leitura)
app.post('/api/sanity/query', authenticateBackendKey, async (req, res) => {
  try {
    if (!process.env.SANITY_TOKEN || !process.env.SANITY_PROJECT_ID) {
      return res.status(500).json({
        error: 'SANITY_TOKEN ou SANITY_PROJECT_ID não configurados no servidor'
      });
    }

    const { query, params = {} } = req.body;
    const dataset = process.env.SANITY_DATASET || 'production';

    if (!query) {
      return res.status(400).json({
        error: 'O campo "query" é obrigatório (GROQ query)'
      });
    }

    const response = await axios.get(
      `https://${process.env.SANITY_PROJECT_ID}.api.sanity.io/v2021-10-21/data/query/${dataset}`,
      {
        params: {
          query,
          ...params
        },
        headers: {
          'Authorization': `Bearer ${process.env.SANITY_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao chamar Sanity Query:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erro ao processar requisição Sanity Query',
      details: error.response?.data || error.message
    });
  }
});

// Proxy para Sanity - Mutations (escrita/criação/atualização/deleção)
app.post('/api/sanity/mutate', authenticateBackendKey, async (req, res) => {
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
        }
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao chamar Sanity Mutate:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: 'Erro ao processar requisição Sanity Mutate',
      details: error.response?.data || error.message
    });
  }
});

// ========================================
// TRATAMENTO DE ERROS
// ========================================

app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

// 404 - Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path
  });
});

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`📍 Acesse: http://localhost:${PORT}`);
  console.log(`🔒 Protegido com API Key: ${process.env.BACKEND_API_KEY ? 'Sim ✓' : 'Não configurada ✗'}`);
  console.log(`🌐 Origins permitidas: ${allowedOrigins.join(', ')}`);
});
