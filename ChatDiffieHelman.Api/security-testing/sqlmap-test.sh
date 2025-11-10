#!/bin/bash
# SQLMap Security Testing Script для NestJS Chat API
# ВНИМАНИЕ: Используйте только на своем API в тестовой среде!

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Конфигурация
API_URL="http://localhost:3000"
SQLMAP_PATH="python3 ~/Рабочий\ стол/sqlmap/sqlmap/sqlmap.py"
OUTPUT_DIR="./sqlmap-results"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testPassword123"

echo -e "${GREEN}=== SQLMap Security Test для NestJS Chat API ===${NC}"
echo "API URL: $API_URL"
echo "Output Directory: $OUTPUT_DIR"
echo ""

# Создаем директорию для результатов
mkdir -p $OUTPUT_DIR

# Функция для получения JWT токена
get_jwt_token() {
    echo -e "${YELLOW}[*] Получение JWT токена...${NC}"
    
    # Регистрация тестового пользователя (если еще не существует)
    curl -s -X POST "$API_URL/users/registration" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Test User\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        > /dev/null 2>&1
    
    # Логин
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    TOKEN=$(echo $RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
    
    if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
        echo -e "${RED}[!] Не удалось получить токен${NC}"
        echo "Response: $RESPONSE"
        return 1
    fi
    
    echo -e "${GREEN}[+] Токен получен: ${TOKEN:0:20}...${NC}"
    echo "$TOKEN"
}

# Получаем токен
JWT_TOKEN=$(get_jwt_token)
if [ $? -ne 0 ]; then
    echo -e "${RED}[!] Ошибка получения токена. Завершение.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== Начало тестирования эндпоинтов ===${NC}"
echo ""

# Test 1: Login endpoint (POST с JSON)
echo -e "${YELLOW}[TEST 1] Тестирование /auth/login (POST)${NC}"
eval $SQLMAP_PATH -u "$API_URL/auth/login" \
    --data='{"email":"test@example.com","password":"test*"}' \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=3 \
    --risk=2 \
    --technique=BEUST \
    --dbms=PostgreSQL \
    --random-agent \
    -o \
    --output-dir="$OUTPUT_DIR/test1-login" \
    2>&1 | tee "$OUTPUT_DIR/test1-login.log"

# Test 2: Get User by ID (GET параметр с UUID)
echo ""
echo -e "${YELLOW}[TEST 2] Тестирование /users/:id (GET с UUID)${NC}"
eval $SQLMAP_PATH -u "$API_URL/users/550e8400-e29b-41d4-a716-446655440000*" \
    --headers="Authorization: Bearer $JWT_TOKEN" \
    --batch \
    --level=3 \
    --risk=2 \
    --dbms=PostgreSQL \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test2-user-id" \
    2>&1 | tee "$OUTPUT_DIR/test2-user-id.log"

# Test 3: User Registration (POST с JSON)
echo ""
echo -e "${YELLOW}[TEST 3] Тестирование /users/registration (POST)${NC}"
eval $SQLMAP_PATH -u "$API_URL/users/registration" \
    --data='{"name":"SQLTest*","email":"sqltest*@test.com","password":"test123"}' \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=3 \
    --risk=2 \
    --dbms=PostgreSQL \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test3-registration" \
    2>&1 | tee "$OUTPUT_DIR/test3-registration.log"

# Test 4: Fiat start endpoint
echo ""
echo -e "${YELLOW}[TEST 4] Тестирование /auth/fiat/start (POST)${NC}"
eval $SQLMAP_PATH -u "$API_URL/auth/fiat/start" \
    --data='{"sid":"test-sid*","t":"abc123*"}' \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=3 \
    --risk=2 \
    --dbms=PostgreSQL \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test4-fiat-start" \
    2>&1 | tee "$OUTPUT_DIR/test4-fiat-start.log"

# Test 5: BMC start endpoint
echo ""
echo -e "${YELLOW}[TEST 5] Тестирование /auth/bmc/start (POST)${NC}"
eval $SQLMAP_PATH -u "$API_URL/auth/bmc/start" \
    --data='{"sid":"test-sid*","a":"abc123*"}' \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=3 \
    --risk=2 \
    --dbms=PostgreSQL \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test5-bmc-start" \
    2>&1 | tee "$OUTPUT_DIR/test5-bmc-start.log"

# Test 6: Cookie-based injection (если используются cookies)
echo ""
echo -e "${YELLOW}[TEST 6] Тестирование Cookie injection${NC}"
eval $SQLMAP_PATH -u "$API_URL/users/all" \
    --cookie="session=test*;token=abc*" \
    --headers="Authorization: Bearer $JWT_TOKEN" \
    --batch \
    --level=3 \
    --risk=2 \
    --dbms=PostgreSQL \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test6-cookies" \
    2>&1 | tee "$OUTPUT_DIR/test6-cookies.log"

# Test 7: Header injection
echo ""
echo -e "${YELLOW}[TEST 7] Тестирование Header injection${NC}"
eval $SQLMAP_PATH -u "$API_URL/users/me" \
    --headers="Authorization: Bearer $JWT_TOKEN*
X-Forwarded-For: 127.0.0.1*
User-Agent: SQLMap-Test*" \
    --batch \
    --level=4 \
    --risk=2 \
    --dbms=PostgreSQL \
    --output-dir="$OUTPUT_DIR/test7-headers" \
    2>&1 | tee "$OUTPUT_DIR/test7-headers.log"

# Финальный отчет
echo ""
echo -e "${GREEN}=== Тестирование завершено ===${NC}"
echo ""
echo "Результаты сохранены в: $OUTPUT_DIR"
echo ""
echo -e "${YELLOW}Анализ результатов:${NC}"
echo "1. Проверьте логи на наличие уязвимостей (vulnerable)"
echo "2. Ищите сообщения об успешных SQL инъекциях"
echo "3. Обратите внимание на любые таймауты или ошибки БД"
echo ""

# Подсчет найденных уязвимостей
VULNERABILITIES=$(grep -r "vulnerable" $OUTPUT_DIR/*.log | wc -l)
if [ $VULNERABILITIES -gt 0 ]; then
    echo -e "${RED}[!] ВНИМАНИЕ: Обнаружено потенциальных уязвимостей: $VULNERABILITIES${NC}"
    echo -e "${RED}[!] Требуется немедленное исправление!${NC}"
    grep -r "vulnerable" $OUTPUT_DIR/*.log
else
    echo -e "${GREEN}[+] SQL инъекции не обнаружены в автоматических тестах${NC}"
    echo -e "${YELLOW}[!] Рекомендуется ручное тестирование и code review${NC}"
fi

echo ""
echo "Для детального анализа используйте:"
echo "  grep -r 'vulnerable\\|injectable\\|error' $OUTPUT_DIR/"
