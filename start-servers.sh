#!/bin/bash

# Скрипт для запуска серверов Personal Stylist Pro
echo "🚀 Запуск Personal Stylist Pro..."

# Функция для проверки порта
check_port() {
    local port=$1
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Функция для ожидания запуска сервера
wait_for_server() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo "⏳ Ожидание запуска $name на порту $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if check_port $port; then
            echo "✅ $name запущен на порту $port"
            return 0
        fi
        
        echo "   Попытка $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ $name не запустился на порту $port"
    return 1
}

# Остановка существующих процессов
echo "🛑 Остановка существующих процессов..."
pkill -f "node server.cjs" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Запуск backend сервера
echo "🔧 Запуск backend сервера (порт 3001)..."
node server.cjs &
BACKEND_PID=$!

# Ожидание запуска backend
if wait_for_server 3001 "Backend Server"; then
    echo "✅ Backend сервер успешно запущен (PID: $BACKEND_PID)"
else
    echo "❌ Ошибка запуска backend сервера"
    exit 1
fi

# Запуск frontend сервера
echo "🎨 Запуск frontend сервера (порт 8081)..."
npm run dev &
FRONTEND_PID=$!

# Ожидание запуска frontend
if wait_for_server 8081 "Frontend Server"; then
    echo "✅ Frontend сервер успешно запущен (PID: $FRONTEND_PID)"
else
    echo "❌ Ошибка запуска frontend сервера"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Проверка всех сервисов
echo "🔍 Проверка всех сервисов..."
echo "   Backend API: $(curl -s http://localhost:3001/api/health | head -1)"
echo "   Frontend: $(curl -s http://localhost:8081 | head -1 | cut -c1-50)..."
echo "   GigaChat: $(curl -s http://localhost:3001/api/gigachat/test | head -1 | cut -c1-50)..."

echo ""
echo "🎉 Personal Stylist Pro успешно запущен!"
echo "📱 Frontend: http://localhost:8081"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "Для остановки серверов нажмите Ctrl+C"

# Функция для корректного завершения
cleanup() {
    echo ""
    echo "🛑 Остановка серверов..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    pkill -f "node server.cjs" 2>/dev/null
    pkill -f "vite" 2>/dev/null
    echo "✅ Серверы остановлены"
    exit 0
}

# Обработка сигналов для корректного завершения
trap cleanup SIGINT SIGTERM

# Ожидание
wait