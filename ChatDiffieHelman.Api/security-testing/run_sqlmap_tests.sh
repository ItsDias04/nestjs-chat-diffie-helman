#!/bin/bash
# Скрипт для запуска автоматизированного тестирования SQL-инъекций
# Используется на Ubuntu с установленным sqlmap

set -e

echo "=================================================="
echo "SQLMap Automation Script для Chat Diffie-Hellman API"
echo "=================================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверка наличия Python 3
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python 3 не установлен${NC}"
    echo "Установите: sudo apt-get install python3"
    exit 1
fi

# Проверка наличия SQLMap
if ! command -v sqlmap &> /dev/null; then
    echo -e "${RED}SQLMap не установлен${NC}"
    echo "Установка SQLMap..."
    sudo apt-get update
    sudo apt-get install -y sqlmap
fi

# Проверка версии SQLMap
echo -e "${GREEN}Версия SQLMap:${NC}"
sqlmap --version

# Проверка наличия swagger-spec.json
if [ ! -f "../swagger-spec.json" ]; then
    echo -e "${RED}Файл swagger-spec.json не найден${NC}"
    exit 1
fi

# Создание директорий для результатов
mkdir -p sqlmap_results
mkdir -p logs

# Установка Python зависимостей (если требуются)
echo -e "${YELLOW}Проверка Python зависимостей...${NC}"
# Раскомментируйте, если используете виртуальное окружение
# python3 -m venv venv
# source venv/bin/activate

# Настройка переменных окружения
export API_BASE_URL="${API_BASE_URL:-http://localhost:3000}"
export JWT_TOKEN="${JWT_TOKEN:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk}"

echo -e "${GREEN}Конфигурация:${NC}"
echo "API URL: $API_BASE_URL"
echo "JWT Token: ${JWT_TOKEN:0:50}..."
echo ""

# Проверка доступности API
echo -e "${YELLOW}Проверка доступности API...${NC}"
if curl -s --head --request GET "$API_BASE_URL/users/all" \
    -H "Authorization: Bearer $JWT_TOKEN" | grep "200\|401\|403" > /dev/null; then
    echo -e "${GREEN}API доступен${NC}"
else
    echo -e "${RED}API недоступен. Убедитесь, что сервер запущен${NC}"
    exit 1
fi

# Запуск основного скрипта
echo -e "\n${GREEN}Запуск автоматизированного тестирования...${NC}\n"
python3 sqlmap_automation.py

# Проверка результатов
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✓ Тестирование завершено успешно!${NC}"
    echo -e "Результаты сохранены в директории: ${YELLOW}sqlmap_results/${NC}"
    echo -e "Логи доступны в файле: ${YELLOW}sqlmap_automation.log${NC}"
    
    # Подсчет результатов
    if [ -d "sqlmap_results" ]; then
        total_tests=$(find sqlmap_results -name "request_info.json" | wc -l)
        echo -e "\nВсего проведено тестов: ${YELLOW}$total_tests${NC}"
    fi
else
    echo -e "\n${RED}✗ Ошибка при выполнении тестирования${NC}"
    exit 1
fi

# Генерация сводного отчета
echo -e "\n${YELLOW}Генерация сводного отчета...${NC}"
if [ -f "sqlmap_results/final_report_"*.json ]; then
    latest_report=$(ls -t sqlmap_results/final_report_*.json | head -1)
    echo -e "${GREEN}Отчет сохранен: ${latest_report}${NC}"
    
    # Вывод краткой сводки
    if command -v jq &> /dev/null; then
        echo -e "\n${YELLOW}Краткая сводка:${NC}"
        jq '.summary' "$latest_report"
    fi
fi

echo -e "\n${GREEN}=================================================="
echo "Тестирование завершено!"
echo "==================================================${NC}"
