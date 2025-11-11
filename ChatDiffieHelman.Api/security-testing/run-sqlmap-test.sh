#!/bin/bash

# Скрипт для запуска автоматического тестирования SQLMap
# Использует тестовые данные из БД

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
API_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testPassword123"
TEST_USERNAME="test user"

# Известный JWT токен из БД (может быть устаревшим)
KNOWN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       SQLMap Автоматическое Тестирование API                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Проверка зависимостей
echo -e "${YELLOW}🔍 Проверка зависимостей...${NC}"

if ! command -v sqlmap &> /dev/null; then
    echo -e "${RED}❌ sqlmap не установлен!${NC}"
    echo -e "${YELLOW}Установите: sudo apt-get install sqlmap${NC}"
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ python3 не установлен!${NC}"
    exit 1
fi

if ! python3 -c "import requests" 2>/dev/null; then
    echo -e "${RED}❌ Python модуль 'requests' не установлен!${NC}"
    echo -e "${YELLOW}Установите: pip3 install requests${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Все зависимости установлены${NC}"
echo ""

# Проверка API
echo -e "${YELLOW}🌐 Проверка доступности API: $API_URL${NC}"

if ! curl -s --connect-timeout 5 "$API_URL" > /dev/null; then
    echo -e "${RED}❌ API недоступен по адресу $API_URL${NC}"
    echo -e "${YELLOW}Убедитесь, что API запущен: npm run start:dev${NC}"
    exit 1
fi

echo -e "${GREEN}✅ API доступен${NC}"
echo ""

# Функция для получения токена
get_token() {
    echo -e "${YELLOW}🔑 Попытка получения JWT токена...${NC}"
    
    # Сначала попробуем зарегистрировать пользователя
    echo -e "${BLUE}   📝 Регистрация тестового пользователя...${NC}"
    REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/users/registration" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$TEST_USERNAME\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" == "201" ]; then
        echo -e "${GREEN}   ✅ Пользователь зарегистрирован${NC}"
    elif [ "$HTTP_CODE" == "409" ]; then
        echo -e "${BLUE}   ℹ️  Пользователь уже существует${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Регистрация вернула код $HTTP_CODE${NC}"
    fi
    
    # Попытка логина
    echo -e "${BLUE}   🔐 Вход в систему...${NC}"
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    # Извлечение токена (работает с или без jq)
    if command -v jq &> /dev/null; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')
    else
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    fi
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "${GREEN}   ✅ JWT токен получен${NC}"
        echo -e "${BLUE}   🔑 Токен: ${TOKEN:0:50}...${NC}"
        echo "$TOKEN"
        return 0
    else
        echo -e "${RED}   ❌ Не удалось получить токен${NC}"
        echo -e "${YELLOW}   📄 Ответ API: $LOGIN_RESPONSE${NC}"
        return 1
    fi
}

# Основной процесс
echo -e "${YELLOW}🚀 Запуск тестирования...${NC}"
echo ""

# Проверка аргументов
if [ "$1" == "--token" ] && [ -n "$2" ]; then
    # Использовать предоставленный токен
    JWT_TOKEN="$2"
    echo -e "${GREEN}✅ Использую предоставленный токен${NC}"
elif [ "$1" == "--known-token" ]; then
    # Использовать известный токен из БД
    JWT_TOKEN="$KNOWN_TOKEN"
    echo -e "${YELLOW}⚠️  Использую известный токен из БД (может быть устаревшим)${NC}"
    echo -e "${BLUE}🔑 Токен: ${JWT_TOKEN:0:50}...${NC}"
else
    # Получить новый токен
    if JWT_TOKEN=$(get_token); then
        echo ""
    else
        echo -e "${RED}❌ Не удалось получить JWT токен${NC}"
        echo -e "${YELLOW}Попробуйте запустить с существующим токеном:${NC}"
        echo -e "${BLUE}  ./run-sqlmap-test.sh --token YOUR_TOKEN${NC}"
        echo -e "${BLUE}  ./run-sqlmap-test.sh --known-token${NC}"
        exit 1
    fi
fi

# Запуск Python скрипта
echo -e "${YELLOW}🔍 Запуск SQLMap тестирования...${NC}"
echo ""

python3 sqlmap-auto-test.py \
    --api-url "$API_URL" \
    --token "$JWT_TOKEN"

echo ""
echo -e "${GREEN}✅ Тестирование завершено!${NC}"
echo -e "${BLUE}📁 Результаты сохранены в: sqlmap-results/${NC}"
