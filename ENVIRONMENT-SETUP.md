# 🔒 Configuração de Environment (Credenciais)

## ⚠️ IMPORTANTE - SEGURANÇA

Os arquivos de environment contêm credenciais sensíveis e **NÃO devem ser commitados** no Git.

## 🛠️ Como Configurar

### 1. Copie os arquivos exemplo:
```bash
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
```

### 2. Configure suas credenciais do Supabase:

Edite os arquivos criados e substitua:
- `YOUR_SUPABASE_URL_HERE` pela URL do seu projeto Supabase
- `YOUR_SUPABASE_ANON_KEY_HERE` pela chave anônima do seu projeto Supabase

### 3. Onde encontrar as credenciais:

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **API**
4. Copie a **URL** e **anon key**

### 🔐 Estrutura Final:

```typescript
export const environment = {
  production: false, // ou true para prod
  supabase: {
    url: 'https://seuprojetoid.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
};
```

### 🚨 Nunca commite:
- `environment.ts`
- `environment.prod.ts`
- Qualquer arquivo com credenciais reais

### ✅ Sempre commite:
- `environment.example.ts`
- `environment.prod.example.ts`
- Este README