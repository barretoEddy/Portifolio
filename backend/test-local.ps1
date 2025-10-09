# Teste do Backend Local
Write-Host "`n🧪 TESTANDO BACKEND LOCAL...`n" -ForegroundColor Cyan

# Teste 1: Health Check
Write-Host "1️⃣ Testando Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/health"
    Write-Host "✅ Health OK!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro no Health: $($_.Exception.Message)" -ForegroundColor Red
}

# Teste 2: Gemini Generate (COM autenticação)
Write-Host "`n2️⃣ Testando Gemini Generate..." -ForegroundColor Yellow
try {
    $headers = @{
        "Content-Type" = "application/json"
        "x-backend-api-key" = "MinhaChaveSecreta123!@#"
    }
    $body = @{
        prompt = "Diga apenas: Olá do backend!"
        model = "gemini-2.0-flash-exp"
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "http://localhost:3000/api/gemini/generate" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Gemini OK!" -ForegroundColor Green
    Write-Host "   Resposta: $($result.candidates[0].content.parts[0].text.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Erro no Gemini: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

# Teste 3: Gemini SEM autenticação (deve falhar)
Write-Host "`n3️⃣ Testando Gemini SEM autenticação (deve dar erro 401)..." -ForegroundColor Yellow
try {
    $body = @{
        prompt = "Teste"
        model = "gemini-2.0-flash-exp"
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "http://localhost:3000/api/gemini/generate" -Method POST -Body $body -ContentType "application/json"
    Write-Host "❌ PROBLEMA: Deveria ter bloqueado!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Autenticação funcionando! (Bloqueou corretamente)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erro inesperado: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ TESTES CONCLUÍDOS!`n" -ForegroundColor Cyan
