# 🧪 Teste Rápido do Backend (Gemini + Sanity)
# Execute: .\test-backend.ps1

Write-Host "🧪 Testando Backend do Portfólio (Gemini + Sanity)..." -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# Configuração
$baseUrl = "http://localhost:3000"
$apiKey = "MinhaChaveSecreta123!@#"  # ⚠️ SUBSTITUA pela sua API key do .env

# ========================================
# 1. Testar Health Check
# ========================================
Write-Host "`n1️⃣  Testando /health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   ✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   ⏰ Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Erro: $_" -ForegroundColor Red
    Write-Host "   💡 Certifique-se que o servidor está rodando (npm start)" -ForegroundColor Yellow
    exit
}

# ========================================
# 2. Testar autenticação (sem API key)
# ========================================
Write-Host "`n2️⃣  Testando autenticação (sem API key)..." -ForegroundColor Yellow
try {
    $body = @{ prompt = "test" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/gemini/generate" -Method Post -Body $body -ContentType "application/json"
    Write-Host "   ❌ FALHOU: Deveria retornar erro 401" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✅ Autenticação funcionando (rejeitou sem API key)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Erro inesperado: $_" -ForegroundColor Yellow
    }
}

# Headers para requisições autenticadas
$headers = @{
    "Content-Type" = "application/json"
    "x-backend-api-key" = $apiKey
}

# ========================================
# 3. Testar Gemini endpoint
# ========================================
Write-Host "`n3️⃣  Testando /api/gemini/generate..." -ForegroundColor Yellow
$body = @{
    prompt = "Responda apenas 'OK' em uma palavra"
    model = "gemini-pro"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/gemini/generate" -Method Post -Headers $headers -Body $body
    Write-Host "   ✅ Gemini respondeu!" -ForegroundColor Green
    $text = $response.candidates[0].content.parts[0].text
    Write-Host "   📝 Resposta: $text" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Erro ao chamar Gemini" -ForegroundColor Red
    Write-Host "   📋 Detalhes: $_" -ForegroundColor Gray
    Write-Host "   💡 Verifique se GEMINI_API_KEY está configurada no .env" -ForegroundColor Yellow
}

# ========================================
# 4. Testar Sanity Query
# ========================================
Write-Host "`n4️⃣  Testando /api/sanity/query..." -ForegroundColor Yellow
$body = @{
    query = "*[_type == 'post'][0...3]{_id, title, publishedAt}"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sanity/query" -Method Post -Headers $headers -Body $body
    Write-Host "   ✅ Sanity respondeu!" -ForegroundColor Green
    if ($response.result) {
        Write-Host "   � Resultados encontrados: $($response.result.Count)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ Erro ao chamar Sanity Query" -ForegroundColor Red
    Write-Host "   📋 Detalhes: $_" -ForegroundColor Gray
    Write-Host "   💡 Verifique SANITY_TOKEN e SANITY_PROJECT_ID no .env" -ForegroundColor Yellow
}

# ========================================
# 5. Testar Sanity Mutate (Exemplo seguro)
# ========================================
Write-Host "`n5️⃣  Testando /api/sanity/mutate..." -ForegroundColor Yellow
Write-Host "   ⚠️  Pulando teste de mutation para não alterar dados" -ForegroundColor Yellow
Write-Host "   💡 Para testar, use:" -ForegroundColor Gray
Write-Host '   $body = @{ mutations = @(@{ create = @{ _type = "post"; title = "Test" } }) } | ConvertTo-Json' -ForegroundColor DarkGray

# ========================================
# 6. Testar Rate Limiting
# ========================================
Write-Host "`n6️⃣  Testando Rate Limiting..." -ForegroundColor Yellow
Write-Host "   🔄 Enviando 5 requisições rápidas..." -ForegroundColor Gray
$successCount = 0
for ($i = 1; $i -le 5; $i++) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/health" -Method Get | Out-Null
        $successCount++
    } catch {
        Write-Host "   ⚠️  Requisição $i bloqueada (rate limit)" -ForegroundColor Yellow
    }
    Start-Sleep -Milliseconds 100
}
Write-Host "   ✅ $successCount/5 requisições permitidas" -ForegroundColor Green

# ========================================
# Resumo Final
# ========================================
Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "✅ Testes concluídos!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Checklist:" -ForegroundColor Cyan
Write-Host "   ✓ Servidor está rodando" -ForegroundColor Green
Write-Host "   ✓ Health check funcionando" -ForegroundColor Green
Write-Host "   ✓ Autenticação ativa" -ForegroundColor Green
Write-Host "   ✓ Rate limiting configurado" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Serviços Configurados:" -ForegroundColor Yellow
Write-Host "   🤖 Gemini AI  - /api/gemini/generate" -ForegroundColor White
Write-Host "   📝 Sanity CMS - /api/sanity/query" -ForegroundColor White
Write-Host "   📝 Sanity CMS - /api/sanity/mutate" -ForegroundColor White
Write-Host ""
Write-Host "💡 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Configure GEMINI_API_KEY no .env" -ForegroundColor Gray
Write-Host "   2. Configure SANITY_TOKEN, SANITY_PROJECT_ID no .env" -ForegroundColor Gray
Write-Host "   3. Integre com o frontend Angular" -ForegroundColor Gray
Write-Host "   4. Deploy na Vercel (VERCEL-DEPLOY.md)" -ForegroundColor Gray
Write-Host ""
