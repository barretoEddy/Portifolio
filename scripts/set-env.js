const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carrega as variáveis do arquivo .env
const envConfig = dotenv.config().parsed || {};

// Define valores padrão caso as variáveis não estejam definidas
const environment = {
  production: process.env.NODE_ENV === 'production',
  supabase: {
    url: process.env.SUPABASE_URL || envConfig.SUPABASE_URL || 'YOUR_SUPABASE_URL_HERE',
    anonKey: process.env.SUPABASE_ANON_KEY || envConfig.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY_HERE'
  },
  geminiApiKey: process.env.GEMINI_API_KEY || envConfig.GEMINI_API_KEY || 'GEMINI_API_KEY_HERE'
};

// Cria o conteúdo do arquivo environment.ts
const envFileContent = `export const environment = ${JSON.stringify(environment, null, 2)};
`;

// Escreve no arquivo environment.ts
const envFilePath = path.resolve(__dirname, '../src/environments/environment.ts');
fs.writeFileSync(envFilePath, envFileContent);

console.log('✅ Arquivo environment.ts atualizado com sucesso!');
console.log('📋 Configurações carregadas:');
console.log(`   - Production: ${environment.production}`);
console.log(`   - Supabase URL: ${environment.supabase.url.substring(0, 30)}...`);
console.log(`   - Gemini API Key: ${environment.geminiApiKey === 'GEMINI_API_KEY_HERE' ? 'Não configurada' : 'Configurada ✓'}`);
