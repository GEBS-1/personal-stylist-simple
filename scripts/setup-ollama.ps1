# Скрипт для установки Ollama на Windows
# Запустите от имени администратора

Write-Host "🚀 Установка Ollama для локальных AI моделей..." -ForegroundColor Green

# Проверяем, установлен ли уже Ollama
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "✅ Ollama уже установлен!" -ForegroundColor Green
    ollama --version
} else {
    Write-Host "📥 Скачиваем Ollama..." -ForegroundColor Yellow
    
    # Скачиваем установщик
    $url = "https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.msi"
    $output = "$env:TEMP\ollama-windows-amd64.msi"
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $output
        Write-Host "✅ Файл скачан: $output" -ForegroundColor Green
        
        # Устанавливаем
        Write-Host "🔧 Устанавливаем Ollama..." -ForegroundColor Yellow
        Start-Process msiexec.exe -Wait -ArgumentList "/i $output /quiet"
        
        # Обновляем PATH
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        
        Write-Host "✅ Ollama установлен!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка установки: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Загружаем модель
Write-Host "📦 Загружаем модель Llama 2..." -ForegroundColor Yellow
try {
    ollama pull llama2:7b
    Write-Host "✅ Модель загружена!" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка загрузки модели: $($_.Exception.Message)" -ForegroundColor Red
}

# Тестируем
Write-Host "🧪 Тестируем модель..." -ForegroundColor Yellow
try {
    $testResponse = ollama run llama2:7b "Привет! Как дела?" --timeout 10
    Write-Host "✅ Модель работает!" -ForegroundColor Green
    Write-Host "Ответ: $testResponse" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка тестирования: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 Установка завершена!" -ForegroundColor Green
Write-Host "💡 Для запуска: ollama run llama2:7b" -ForegroundColor Cyan 