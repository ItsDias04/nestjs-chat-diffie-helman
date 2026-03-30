# Автоматизация SQLMap тестирования для Chat Diffie-Hellman API

## 📋 Описание

Этот набор скриптов автоматизирует процесс тестирования SQL-инъекций для всех эндпоинтов API с использованием SQLMap. Скрипты:
- ✅ Автоматически парсят Swagger спецификацию
- ✅ Генерируют корректные запросы для каждого эндпоинта
- ✅ Подставляют JWT токен для аутентификации
- ✅ Тестируют все параметры (path, query, body)
- ✅ Логируют все результаты
- ✅ Генерируют детальные отчеты

## 🔧 Требования

### Для Ubuntu/Linux:
```bash
# Python 3
sudo apt-get update
sudo apt-get install -y python3 python3-pip

# SQLMap
sudo apt-get install -y sqlmap

# Дополнительные утилиты (опционально)
sudo apt-get install -y jq curl
```

## 📁 Структура файлов

```
security-testing/
├── sqlmap_automation.py      # Основной Python скрипт
├── run_sqlmap_tests.sh        # Bash скрипт для запуска
├── config.env                 # Конфигурационный файл
├── SQLMAP-AUTOMATION-README.md # Эта документация
├── sqlmap_results/            # Результаты тестирования (создается автоматически)
└── sqlmap_automation.log      # Лог файл (создается автоматически)
```

## ⚙️ Конфигурация

### 1. Редактирование config.env

Откройте файл `config.env` и настройте параметры:

```bash
# URL вашего API
API_BASE_URL=http://localhost:3001

# JWT токен (получен после логина)
JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ID тестового пользователя
TEST_USER_ID=740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab
```

### 2. Редактирование sqlmap_automation.py

Если необходимо, измените параметры в начале файла:

```python
API_BASE_URL = "http://localhost:3001"  # URL API
JWT_TOKEN = "ваш_jwt_token"             # JWT токен
TEST_USER_ID = "user_id"                # ID пользователя
```

## 🚀 Запуск тестирования

### Метод 1: Через bash скрипт (рекомендуется)

```bash
# Дать права на выполнение
chmod +x run_sqlmap_tests.sh

# Запустить тестирование
./run_sqlmap_tests.sh
```

### Метод 2: Напрямую через Python

```bash
# Загрузить переменные окружения
source config.env

# Запустить скрипт
python3 sqlmap_automation.py
```

### Метод 3: С пользовательскими параметрами

```bash
# Указать свой URL и токен
API_BASE_URL=http://192.168.1.100:3001 \
JWT_TOKEN=your_token_here \
python3 sqlmap_automation.py
```

## 📊 Результаты тестирования

### Структура результатов

После выполнения создается следующая структура:

```
sqlmap_results/
├── UserController_getAllUsers_20251111_143022/
│   ├── request_info.json      # Информация о запросе
│   ├── stdout.log             # Вывод SQLMap
│   ├── stderr.log             # Ошибки SQLMap
│   └── [другие файлы SQLMap]
├── AuthController_login_20251111_143045/
│   └── ...
├── final_report_20251111_150000.json  # Финальный отчет
└── ...
```

### Просмотр результатов

#### 1. Финальный отчет (JSON)

```bash
# Просмотр последнего отчета
cat sqlmap_results/final_report_*.json | jq '.'

# Только сводка
cat sqlmap_results/final_report_*.json | jq '.summary'

# Список уязвимых эндпоинтов
cat sqlmap_results/final_report_*.json | jq '.results[] | select(.vulnerable == true)'
```

#### 2. Лог файл

```bash
# Просмотр всех логов
cat sqlmap_automation.log

# Только ошибки
grep -i "error\|warning" sqlmap_automation.log

# Уязвимые эндпоинты
grep -i "уязвимость найдена" sqlmap_automation.log
```

#### 3. Детальные результаты SQLMap

```bash
# Просмотр результатов для конкретного эндпоинта
cd sqlmap_results/UserController_getAllUsers_20251111_143022/
cat request_info.json
cat stdout.log
```

## 📈 Интерпретация результатов

### Уязвимости найдены

Если SQLMap находит уязвимости, в логе будет:

```
⚠️  УЯЗВИМОСТЬ НАЙДЕНА: AuthController_login
```

В stdout.log будут детали:

```
sqlmap identified the following injection point(s) with a total of XX HTTP(s) requests:
---
Parameter: email (JSON)
    Type: boolean-based blind
    Title: AND boolean-based blind - WHERE or HAVING clause
    Payload: {"email":"test@example.com' AND 1=1-- ","password":"..."}
---
```

### Уязвимости не найдены

```
✓ Уязвимости не найдены: UserController_getAllUsers
```

### Типы уязвимостей

- **Boolean-based blind**: Слепая SQL-инъекция на основе булевой логики
- **Error-based**: SQL-инъекция через сообщения об ошибках
- **Union query-based**: SQL-инъекция через UNION запросы
- **Stacked queries**: Возможность выполнения множественных запросов
- **Time-based blind**: Слепая SQL-инъекция на основе задержек

## 🔍 Тестируемые эндпоинты

Скрипт автоматически тестирует все эндпоинты из swagger-spec.json:

### Users
- `GET /users/all` - Получить всех пользователей
- `GET /users/me` - Получить текущего пользователя
- `GET /users/{id}` - Получить пользователя по ID
- `POST /users/registration` - Регистрация

### Authentication
- `POST /auth/login` - Вход
- `POST /auth/fiat/start` - Старт Fiat-Shamir
- `POST /auth/fiat/finish` - Завершение Fiat-Shamir
- `POST /auth/bmc/start` - Старт BMC
- `POST /auth/bmc/finish` - Завершение BMC
- `POST /auth/fiat/enable/{userId}` - Включить Fiat
- `POST /auth/fiat/disable/{userId}` - Выключить Fiat
- `POST /auth/bmc/enable/{userId}` - Включить BMC
- `POST /auth/bmc/disable/{userId}` - Выключить BMC

### Chats
- `GET /chats` - Получить мои чаты
- `POST /chats` - Создать чат
- `GET /chats/{chatId}` - Получить чат по ID
- `GET /chats/{chatId}/users` - Получить участников чата

### Messages
- `GET /messages/{chatId}` - Получить сообщения
- `POST /messages/{chatId}` - Отправить сообщение

### Invites
- `POST /invites/create` - Создать приглашение
- `GET /invites` - Получить приглашения
- `POST /invites/respond` - Ответить на приглашение

## 🛠️ Расширенные настройки SQLMap

### Изменение уровня тестирования

В `sqlmap_automation.py` измените:

```python
"--level", "5",  # 1-5 (5 = максимум)
"--risk", "3",   # 1-3 (3 = максимум)
```

### Дополнительные параметры

Добавьте в команду SQLMap в функции `_run_sqlmap`:

```python
# Тестирование cookies
"--cookie", "session=xxx",

# Игнорирование 401 ошибок
"--ignore-code", "401",

# Сохранение траффика
"--traffic-out", "traffic.txt",

# Тестирование конкретной СУБД
"--dbms", "postgresql",  # или mysql, mssql, oracle и т.д.

# Дополнительные техники
"--tamper", "space2comment",  # Обход фильтров
```

## 🐛 Устранение неполадок

### Проблема: SQLMap не установлен

```bash
# Ubuntu/Debian
sudo apt-get install sqlmap

# Или через pip
pip3 install sqlmap-python
```

### Проблема: API недоступен

```bash
# Проверьте, запущен ли сервер
curl http://localhost:3001/users/all

# Проверьте JWT токен
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/users/me
```

### Проблема: Таймауты

Увеличьте таймаут в `sqlmap_automation.py`:

```python
timeout=1200  # 20 минут
```

### Проблема: Слишком много false positives

Уменьшите уровень риска:

```python
"--level", "3",  # вместо 5
"--risk", "2",   # вместо 3
```

## 📝 Пример отчета

### Структура JSON отчета

```json
{
  "summary": {
    "total_endpoints": 23,
    "vulnerable_endpoints": 2,
    "safe_endpoints": 21,
    "test_date": "2025-11-11T14:30:00",
    "base_url": "http://localhost:3001"
  },
  "results": [
    {
      "endpoint": "AuthController_login",
      "url": "http://localhost:3001/auth/login",
      "method": "POST",
      "timestamp": "20251111_143045",
      "vulnerable": true,
      "output_dir": "./sqlmap_results/AuthController_login_20251111_143045"
    }
  ]
}
```

## 🔒 Рекомендации по безопасности

1. **Используйте тестовое окружение**: Никогда не запускайте на production!
2. **Изолированная база данных**: Используйте отдельную БД для тестирования
3. **Backup**: Сделайте резервную копию перед тестированием
4. **Мониторинг**: Следите за нагрузкой на сервер во время тестов
5. **Разрешения**: Убедитесь, что у вас есть разрешение на проведение тестов

## 📚 Дополнительные ресурсы

- [Документация SQLMap](https://github.com/sqlmapproject/sqlmap/wiki)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Swagger/OpenAPI](https://swagger.io/docs/)

## 👨‍💻 Автор

Скрипт создан для автоматизации тестирования безопасности Chat Diffie-Hellman API

## 📄 Лицензия

MIT License

---

**⚠️ ВНИМАНИЕ**: Эти инструменты предназначены только для тестирования безопасности в разрешенных средах. Несанкционированное тестирование на безопасность является незаконным.
