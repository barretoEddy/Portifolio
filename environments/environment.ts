export const environment = {
  production: false,
  supabase: {
    // ⚠️ SUBSTITUA PELAS CREDENCIAIS DO SEU PROJETO SUPABASE
    // 1. Acesse: https://supabase.com/dashboard
    // 2. Use as MESMAS credenciais do environment.ts
    // 3. Para produção, considere um projeto separado
    url: 'YOUR_SUPABASE_URL_HERE',
    anonKey: 'YOUR_SUPABASE_ANON_KEY_HERE'
  },
  geminiApiKey: 'GEMINI_API_KEY_HERE'
};
