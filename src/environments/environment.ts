// Configuração de desenvolvimento local
export const environment = {
  production: false,

  // ✅ Backend API (suas keys ficam seguras no backend!)
  backendUrl: 'http://localhost:3000',
  backendApiKey: 'MinhaChaveSecreta123!@#',

  // Supabase (autenticação - ainda no frontend)
  supabase: {
    url: 'https://vqkdckcggandopfmsxqz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa2Rja2NnZ2FuZG9wZm1zeHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA3OTgsImV4cCI6MjA3NDQxNjc5OH0.ZGtLzPukbAwxcLZzdFn_T09B1-wuFx-HfMjQ7hccjDQ'
  },

  // Sanity (apenas configuração pública)
  sanity: {
    projectId: 'qacw4twj',
    dataset: 'production',
    apiVersion: '2024-05-20',
    useCdn: true
  }
};
