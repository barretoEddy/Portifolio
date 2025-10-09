// Configuração de produção (Vercel)
export const environment = {
  production: true,

  // ✅ Backend API (ATUALIZAR após deploy do backend!)
  backendUrl: 'https://seu-backend.vercel.app', // ⚠️ ATUALIZAR COM URL REAL!
  backendApiKey: 'MinhaChaveSecreta123!@#', // Mesma senha do backend

  // Supabase (autenticação)
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
