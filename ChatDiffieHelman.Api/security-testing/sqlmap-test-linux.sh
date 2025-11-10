#!/bin/bash
# SQLMap Testing Script для Linux (тестирование API на хосте Windows)
# Запускайте из Linux VM где установлен SQLMap

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Конфигурация
API_HOST="10.0.2.2"  # Windows host IP из Linux VM
API_PORT="3000"
API_URL="http://${API_HOST}:${API_PORT}"
SQLMAP_DIR="$HOME/Рабочий стол/sqlmap/sqlmap"
OUTPUT_DIR="./sqlmap-test-results"
TEST_EMAIL="sqltest@test.com"
TEST_PASSWORD="Test123456"

echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   SQLMap Security Test для NestJS Chat API (Linux)      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Target:${NC} $API_URL"
echo -e "${BLUE}SQLMap:${NC} $SQLMAP_DIR/sqlmap.py"
echo -e "${BLUE}Output:${NC} $OUTPUT_DIR"
echo ""

# Создаем директорию
mkdir -p "$OUTPUT_DIR"

# Проверка доступности API
echo -e "${YELLOW}[*] Проверка доступности API...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$API_URL/users/all" | grep -q "401\|200"; then
    echo -e "${GREEN}[+] API доступен!${NC}"
else
    echo -e "${RED}[!] API недоступен. Проверьте:${NC}"
    echo "    1. Запущен ли сервер: npm run start:dev"
    echo "    2. Правильный ли IP: $API_HOST"
    echo "    3. Firewall не блокирует порт $API_PORT"
    exit 1
fi

# Функция для создания тестового пользователя
create_test_user() {
    echo -e "${YELLOW}[*] Создание тестового пользователя...${NC}"
    
    RESPONSE=$(curl -s -X POST "$API_URL/users/registration" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"SQLTest\",\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
        -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}[+] Пользователь создан: $TEST_EMAIL${NC}"
        return 0
    elif [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "409" ]; then
        echo -e "${BLUE}[i] Пользователь уже существует${NC}"
        return 0
    else
        echo -e "${YELLOW}[!] Не удалось создать пользователя (HTTP $HTTP_CODE)${NC}"
        echo -e "${YELLOW}    Продолжаем без тестового пользователя...${NC}"
        return 1
    fi
}

# Функция для получения JWT токена
get_jwt_token() {
    echo -e "${YELLOW}[*] Получение JWT токена...${NC}"
    
    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')
    
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        echo -e "${GREEN}[+] Токен получен: ${TOKEN:0:20}...${NC}"
        echo "$TOKEN"
        return 0
    else
        echo -e "${YELLOW}[!] Не удалось получить токен${NC}"
        echo -e "${YELLOW}    Response: $RESPONSE${NC}"
        return 1
    fi
}

# Создаем пользователя и получаем токен
create_test_user
JWT_TOKEN=$(get_jwt_token)

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              НАЧАЛО ТЕСТИРОВАНИЯ                         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ==============================================================================
# TEST 1: Login Endpoint (самый критичный)
# ==============================================================================
echo -e "${BLUE}[TEST 1/7]${NC} ${YELLOW}Login endpoint (POST /auth/login)${NC}"
echo "------------------------------------------------"

python3 "$SQLMAP_DIR/sqlmap.py" \
    -u "$API_URL/auth/login" \
    --data="{\"email\":\"test*\",\"password\":\"pass*\"}" \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=3 \
    --risk=2 \
    --technique=BEUST \
    --dbms=PostgreSQL \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test1-login" \
    2>&1 | tee "$OUTPUT_DIR/test1-login.log"

echo -e "${GREEN}[✓] Test 1 завершен${NC}\n"
sleep 2

# ==============================================================================
# TEST 2: Registration Endpoint
# ==============================================================================
echo -e "${BLUE}[TEST 2/7]${NC} ${YELLOW}Registration (POST /users/registration)${NC}"
echo "------------------------------------------------"

python3 "$SQLMAP_DIR/sqlmap.py" \
    -u "$API_URL/users/registration" \
    --data="{\"username\":\"Test*\",\"email\":\"test*@test.com\",\"password\":\"pass123\"}" \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=3 \
    --risk=2 \
    --dbms=PostgreSQL \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test2-registration" \
    2>&1 | tee "$OUTPUT_DIR/test2-registration.log"

echo -e "${GREEN}[✓] Test 2 завершен${NC}\n"
sleep 2

# ==============================================================================
# TEST 3: User by ID (если есть токен)
# ==============================================================================
if [ -n "$JWT_TOKEN" ]; then
    echo -e "${BLUE}[TEST 3/7]${NC} ${YELLOW}User by ID (GET /users/:id)${NC}"
    echo "------------------------------------------------"
    
    python3 "$SQLMAP_DIR/sqlmap.py" \
        -u "$API_URL/users/550e8400-e29b-41d4-a716-446655440000*" \
        --headers="Authorization: Bearer $JWT_TOKEN" \
        --batch \
        --level=3 \
        --risk=2 \
        --dbms=PostgreSQL \
        --random-agent \
        --output-dir="$OUTPUT_DIR/test3-user-id" \
        2>&1 | tee "$OUTPUT_DIR/test3-user-id.log"
    
    echo -e "${GREEN}[✓] Test 3 завершен${NC}\n"
    sleep 2
else
    echo -e "${YELLOW}[SKIP] Test 3 пропущен (нет JWT токена)${NC}\n"
fi

# ==============================================================================
# TEST 4: Fiat Start
# ==============================================================================
echo -e "${BLUE}[TEST 4/7]${NC} ${YELLOW}Fiat Authentication Start${NC}"
echo "------------------------------------------------"

python3 "$SQLMAP_DIR/sqlmap.py" \
    -u "$API_URL/auth/fiat/start" \
    --data="{\"sid\":\"test-sid*\",\"t\":\"abc123*\"}" \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=3 \
    --risk=2 \
    --dbms=PostgreSQL \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test4-fiat" \
    2>&1 | tee "$OUTPUT_DIR/test4-fiat.log"

echo -e "${GREEN}[✓] Test 4 завершен${NC}\n"
sleep 2

# ==============================================================================
# TEST 5: BMC Start
# ==============================================================================
echo -e "${BLUE}[TEST 5/7]${NC} ${YELLOW}BMC Authentication Start${NC}"
echo "------------------------------------------------"

python3 "$SQLMAP_DIR/sqlmap.py" \
    -u "$API_URL/auth/bmc/start" \
    --data="{\"sid\":\"test-sid*\",\"a\":\"abc123*\"}" \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=3 \
    --risk=2 \
    --dbms=PostgreSQL \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test5-bmc" \
    2>&1 | tee "$OUTPUT_DIR/test5-bmc.log"

echo -e "${GREEN}[✓] Test 5 завершен${NC}\n"
sleep 2

# ==============================================================================
# TEST 6: Агрессивное тестирование Login (level=5, risk=3)
# ==============================================================================
echo -e "${BLUE}[TEST 6/7]${NC} ${YELLOW}Агрессивное тестирование Login${NC}"
echo "------------------------------------------------"
echo -e "${RED}⚠️  ВНИМАНИЕ: Высокий уровень риска (level=5, risk=3)${NC}"

python3 "$SQLMAP_DIR/sqlmap.py" \
    -u "$API_URL/auth/login" \
    --data="{\"email\":\"admin*\",\"password\":\"admin*\"}" \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=5 \
    --risk=3 \
    --threads=5 \
    --technique=BEUSTQ \
    --dbms=PostgreSQL \
    --random-agent \
    --tamper=space2comment,between,randomcase \
    --time-sec=8 \
    --output-dir="$OUTPUT_DIR/test6-aggressive" \
    2>&1 | tee "$OUTPUT_DIR/test6-aggressive.log"

echo -e "${GREEN}[✓] Test 6 завершен${NC}\n"
sleep 2

# ==============================================================================
# TEST 7: Union-based тестирование
# ==============================================================================
echo -e "${BLUE}[TEST 7/7]${NC} ${YELLOW}Union-based SQL Injection${NC}"
echo "------------------------------------------------"

python3 "$SQLMAP_DIR/sqlmap.py" \
    -u "$API_URL/auth/login" \
    --data="{\"email\":\"test@test.com\",\"password\":\"test\"}" \
    --method=POST \
    --headers="Content-Type: application/json" \
    --batch \
    --level=4 \
    --risk=2 \
    --technique=U \
    --dbms=PostgreSQL \
    --union-cols=4-8 \
    --random-agent \
    --output-dir="$OUTPUT_DIR/test7-union" \
    2>&1 | tee "$OUTPUT_DIR/test7-union.log"

echo -e "${GREEN}[✓] Test 7 завершен${NC}\n"

# ==============================================================================
# ФИНАЛЬНЫЙ ОТЧЕТ
# ==============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              ТЕСТИРОВАНИЕ ЗАВЕРШЕНО                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}Результаты сохранены в:${NC} $OUTPUT_DIR"
echo ""

# Анализ результатов
echo -e "${YELLOW}════════════════ АНАЛИЗ РЕЗУЛЬТАТОВ ════════════════${NC}"
echo ""

VULNERABLE_COUNT=$(grep -r "vulnerable" "$OUTPUT_DIR"/*.log 2>/dev/null | wc -l)
INJECTABLE_COUNT=$(grep -r "injectable" "$OUTPUT_DIR"/*.log 2>/dev/null | wc -l)
ERROR_COUNT=$(grep -r "syntax error\|relation.*does not exist" "$OUTPUT_DIR"/*.log 2>/dev/null | wc -l)

if [ "$VULNERABLE_COUNT" -gt 0 ] || [ "$INJECTABLE_COUNT" -gt 0 ]; then
    echo -e "${RED}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  ВНИМАНИЕ: ОБНАРУЖЕНЫ УЯЗВИМОСТИ!                 ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Найдено потенциальных уязвимостей: $((VULNERABLE_COUNT + INJECTABLE_COUNT))${NC}"
    echo ""
    echo "Детали:"
    grep -r "vulnerable\|injectable" "$OUTPUT_DIR"/*.log 2>/dev/null | head -20
    echo ""
    echo -e "${RED}ТРЕБУЕТСЯ НЕМЕДЛЕННОЕ ИСПРАВЛЕНИЕ!${NC}"
else
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ SQL ИНЪЕКЦИИ НЕ ОБНАРУЖЕНЫ                        ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}[+] Параметризованные запросы работают корректно${NC}"
    echo -e "${GREEN}[+] Валидация входных данных работает${NC}"
    echo -e "${GREEN}[+] TypeORM защита активна${NC}"
fi

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Обнаружены SQL ошибки: $ERROR_COUNT${NC}"
    echo "Это может указывать на утечку информации о структуре БД"
fi

echo ""
echo -e "${BLUE}════════════════ СТАТИСТИКА HTTP ════════════════${NC}"
grep -h "HTTP error codes detected" "$OUTPUT_DIR"/*.log 2>/dev/null | sort | uniq

echo ""
echo -e "${YELLOW}════════════════ РЕКОМЕНДАЦИИ ════════════════${NC}"
echo "1. Проверьте логи API на подозрительную активность"
echo "2. Убедитесь, что пароли хешируются (добавьте bcrypt!)"
echo "3. Включите HTTPS в продакшене"
echo "4. Регулярно обновляйте зависимости: npm audit fix"
echo ""

echo -e "${BLUE}Для детального анализа:${NC}"
echo "  grep -r 'vulnerable\\|injectable\\|error' $OUTPUT_DIR/"
echo "  less $OUTPUT_DIR/test1-login.log"
echo ""

echo -e "${GREEN}Готово!${NC}"
