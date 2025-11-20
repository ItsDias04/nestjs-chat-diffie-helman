# 📋 Шпаргалка по SQLMap тестированию

## Быстрые команды

### Ubuntu/Linux
```bash
# Полное тестирование
./run_sqlmap_tests.sh

# Быстрый тест отдельного эндпоинта
python3 quick_test.py 4

# Генерация HTML отчета
python3 generate_report.py sqlmap_results/final_report_*.json
```

### Windows (через WSL)
```powershell
# Полное тестирование
.\run_sqlmap_tests.ps1

# Или через WSL напрямую
wsl ./run_sqlmap_tests.sh

# Быстрый тест
wsl python3 quick_test.py 4
```

## Конфигурация

### Файл config.env
```bash
API_BASE_URL=http://localhost:3000
JWT_TOKEN=your_jwt_token
TEST_USER_ID=your_user_id
SQLMAP_LEVEL=5
SQLMAP_RISK=3
SQLMAP_TIMEOUT=600
```

### Переменные окружения
```bash
export API_BASE_URL=http://localhost:3000
export JWT_TOKEN=your_token
python3 sqlmap_automation.py
```

## Структура результатов

```
sqlmap_results/
├── EndpointName_20251111_143022/    # Результаты для эндпоинта
│   ├── request_info.json            # Информация о запросе
│   ├── stdout.log                   # Вывод SQLMap
│   └── stderr.log                   # Ошибки
├── final_report_20251111.json       # Финальный JSON отчет
└── final_report_20251111.html       # HTML отчет
```

## Быстрые тесты (quick_test.py)

```bash
# Список всех тестов
python3 quick_test.py

# Доступные тесты:
1  - GET /users/all
2  - GET /users/me
3  - GET /users/{id}
4  - POST /auth/login
5  - POST /users/registration
6  - GET /chats
7  - POST /chats
8  - GET /chats/{chatId}
9  - GET /messages/{chatId}
10 - POST /messages/{chatId}
11 - GET /invites
12 - POST /invites/create
```

## Анализ результатов

### Просмотр логов
```bash
# Все логи
cat sqlmap_automation.log

# Только уязвимости
grep "УЯЗВИМОСТЬ НАЙДЕНА" sqlmap_automation.log

# Последние 50 строк
tail -50 sqlmap_automation.log
```

### Просмотр JSON отчета
```bash
# С помощью jq
cat sqlmap_results/final_report_*.json | jq '.summary'

# Список уязвимых эндпоинтов
cat sqlmap_results/final_report_*.json | jq '.results[] | select(.vulnerable == true)'

# Без jq
cat sqlmap_results/final_report_*.json
```

### Детальный просмотр
```bash
cd sqlmap_results/UserController_getAllUsers_20251111_143022/
cat request_info.json    # Информация о запросе
cat stdout.log          # Полный вывод SQLMap
```

## Типы уязвимостей

| Тип | Описание |
|-----|----------|
| **Boolean-based blind** | Слепая инъекция на основе булевой логики |
| **Error-based** | Инъекция через сообщения об ошибках |
| **Union query-based** | Инъекция через UNION запросы |
| **Stacked queries** | Выполнение множественных запросов |
| **Time-based blind** | Слепая инъекция на основе задержек |

## Параметры SQLMap

### Уровни тестирования (--level)
```
1 - Базовый (только GET параметры)
2 - Стандартный (+ cookies)
3 - Расширенный (+ User-Agent, Referer)
4 - Агрессивный (+ дополнительные заголовки)
5 - Максимальный (все параметры и техники)
```

### Уровни риска (--risk)
```
1 - Безопасный (стандартные запросы)
2 - Средний (+ тяжелые запросы)
3 - Агрессивный (+ обновления данных)
```

### Техники (--technique)
```
B - Boolean-based blind
E - Error-based
U - Union query-based
S - Stacked queries
T - Time-based blind
Q - Inline queries
```

## Устранение проблем

### SQLMap не найден
```bash
# Ubuntu
sudo apt-get install sqlmap

# Или клонировать
git clone https://github.com/sqlmapproject/sqlmap.git
python3 sqlmap/sqlmap.py --version
```

### API недоступен
```bash
# Проверка доступности
curl http://localhost:3000/users/all

# Проверка с токеном
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/users/me
```

### WSL проблемы (Windows)
```powershell
# Проверка WSL
wsl --version

# Установка Ubuntu
wsl --install -d Ubuntu

# Обновление WSL
wsl --update
```

### Timeout ошибки
```bash
# Увеличить timeout в config.env
SQLMAP_TIMEOUT=1200  # 20 минут
```

## Документация

| Файл | Описание |
|------|----------|
| **README-RU.md** | Быстрый старт |
| **SQLMAP-AUTOMATION-README.md** | Детальная документация |
| **SQLMAP-GUIDE.md** | Оригинальное руководство |
| **WINDOWS-GUIDE.md** | Инструкции для Windows |
| **CHEATSHEET.md** | Эта шпаргалка |

## Полезные ссылки

- [SQLMap Wiki](https://github.com/sqlmapproject/sqlmap/wiki)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [NestJS Security](https://docs.nestjs.com/security/encryption-and-hashing)

## Контрольный список

- [ ] SQLMap установлен
- [ ] API запущен (npm run start:dev)
- [ ] config.env настроен
- [ ] JWT токен актуальный
- [ ] Тестовый пользователь создан
- [ ] Backup базы данных сделан
- [ ] Тестирование разрешено
- [ ] Не production окружение

## Пример полного цикла

```bash
# 1. Настройка
nano config.env

# 2. Запуск API (в другом терминале)
cd ../
npm run start:dev

# 3. Полное тестирование
./run_sqlmap_tests.sh

# 4. Просмотр результатов
cat sqlmap_automation.log | grep "УЯЗВИМОСТЬ"

# 5. Генерация отчета
python3 generate_report.py sqlmap_results/final_report_*.json

# 6. Открыть HTML отчет
firefox sqlmap_results/final_report_*.html
```

---

**⚠️ Только для тестовых окружений!**
