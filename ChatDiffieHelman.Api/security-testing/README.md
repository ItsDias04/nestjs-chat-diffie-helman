# 🔒 SQLMap Security Testing - Chat Diffie-Hellman API

Автоматизированное тестирование безопасности всех эндпоинтов API на SQL-инъекции.

---

## 📚 Документация

| Файл | Описание | Для кого |
|------|----------|---------|
| **[README-RU.md](./README-RU.md)** | 🚀 Быстрый старт | Начните здесь |
| **[SQLMAP-AUTOMATION-README.md](./SQLMAP-AUTOMATION-README.md)** | 📖 Детальная документация | Полное руководство |
| **[CHEATSHEET.md](./CHEATSHEET.md)** | 📋 Шпаргалка | Быстрые команды |
| **[WINDOWS-GUIDE.md](./WINDOWS-GUIDE.md)** | 🪟 Для Windows | Пользователи Windows |
| **[SQLMAP-GUIDE.md](./SQLMAP-GUIDE.md)** | 📚 Оригинальное руководство | Расширенное использование |

---

## ⚡ Быстрый старт

### Ubuntu/Linux
```bash
chmod +x run_sqlmap_tests.sh
./run_sqlmap_tests.sh
```

### Windows (через WSL)
```powershell
.\run_sqlmap_tests.ps1
```

---

## 📦 Файлы и скрипты

### Основные скрипты
- **`sqlmap_automation.py`** - Автоматическое тестирование всех эндпоинтов
- **`quick_test.py`** - Быстрое тестирование отдельных эндпоинтов  
- **`generate_report.py`** - Генерация HTML отчетов
- **`run_sqlmap_tests.sh`** - Bash скрипт для Ubuntu/Linux
- **`run_sqlmap_tests.ps1`** - PowerShell скрипт для Windows

### Конфигурация
- **`config.env`** - Параметры тестирования (API URL, токены, настройки)

### Документация
- **`README.md`** - Этот файл (навигация)
- **`README-RU.md`** - Быстрый старт на русском
- **`SQLMAP-AUTOMATION-README.md`** - Полная документация
- **`CHEATSHEET.md`** - Шпаргалка по командам
- **`WINDOWS-GUIDE.md`** - Руководство для Windows
- **`SQLMAP-GUIDE.md`** - Оригинальное руководство

---

## 🎯 Что тестируется

Автоматически тестируются **все 23 эндпоинта** из `swagger-spec.json`:

- ✅ **Users API** (4 эндпоинта)
- ✅ **Authentication** (8 эндпоинтов)
- ✅ **Chats** (4 эндпоинта)
- ✅ **Messages** (2 эндпоинта)
- ✅ **Invites** (3 эндпоинта)

### Тестируемые параметры
- Path параметры (`/users/{id}`)
- Query параметры (`?filter=...`)
- Body параметры (JSON)
- Headers (включая Authorization)

---

## 📊 Результаты

После тестирования создаются:

```
sqlmap_results/
├── EndpointName_TIMESTAMP/          # Детальные результаты
│   ├── request_info.json
│   ├── stdout.log
│   └── stderr.log
├── final_report_TIMESTAMP.json      # JSON отчет
└── final_report_TIMESTAMP.html      # HTML отчет
```

### Просмотр результатов
```bash
# Логи
cat sqlmap_automation.log

# JSON отчет
cat sqlmap_results/final_report_*.json | jq '.summary'

# HTML отчет (автоматически генерируется)
firefox sqlmap_results/final_report_*.html
```

---

## ⚙️ Требования

### Ubuntu/Linux
```bash
sudo apt-get update
sudo apt-get install -y sqlmap python3 curl jq
```

### Windows
- **WSL** (Windows Subsystem for Linux) - рекомендуется
- Или **Docker**
- Или **VirtualBox** с Ubuntu

См. [WINDOWS-GUIDE.md](./WINDOWS-GUIDE.md) для деталей.

---

## 🔧 Конфигурация

Отредактируйте `config.env`:

```bash
# API настройки
API_BASE_URL=http://localhost:3001
JWT_TOKEN=your_jwt_token_here
TEST_USER_ID=your_test_user_id

# SQLMap параметры
SQLMAP_LEVEL=5      # 1-5 (5 = максимум)
SQLMAP_RISK=3       # 1-3 (3 = максимум)
SQLMAP_THREADS=5    # Количество потоков
SQLMAP_TIMEOUT=600  # Таймаут (секунды)
```

---

## 💡 Примеры использования

### Полное тестирование
```bash
./run_sqlmap_tests.sh
```

### Быстрый тест одного эндпоинта
```bash
python3 quick_test.py 4  # Тест логина
```

### С пользовательскими параметрами
```bash
API_BASE_URL=http://192.168.1.100:3001 \
JWT_TOKEN=new_token \
python3 sqlmap_automation.py
```

### Генерация HTML отчета
```bash
python3 generate_report.py sqlmap_results/final_report_*.json
```

---

## ⚠️ Важные предупреждения

- ❌ **НЕ запускайте на production!**
- ✅ Используйте только на тестовых серверах
- ✅ Сделайте backup базы данных
- ✅ Получите разрешение на тестирование
- ✅ Изолируйте тестовое окружение

---

## 🐛 Устранение проблем

### SQLMap не найден
```bash
sudo apt-get install sqlmap
```

### API недоступен
```bash
# Проверьте, запущен ли сервер
curl http://localhost:3001/users/all

# Убедитесь, что JWT токен валидный
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/users/me
```

### WSL проблемы (Windows)
```powershell
wsl --install
wsl --update
```

Подробнее в [WINDOWS-GUIDE.md](./WINDOWS-GUIDE.md)

---

## 📖 Дополнительные ресурсы

- [SQLMap Official Wiki](https://github.com/sqlmapproject/sqlmap/wiki)
- [OWASP SQL Injection Guide](https://owasp.org/www-community/attacks/SQL_Injection)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/encryption-and-hashing)

---

## 🎓 Учебные цели

Этот проект создан для:
- Изучения техник SQL-инъекций
- Практики тестирования безопасности
- Понимания защиты веб-приложений
- Автоматизации security testing

---

## 📝 Лицензия

MIT License - создано для образовательных целей

---

## 🚀 С чего начать?

1. **Новичок?** → Читайте [README-RU.md](./README-RU.md)
2. **Опытный?** → Смотрите [CHEATSHEET.md](./CHEATSHEET.md)
3. **Windows?** → Изучите [WINDOWS-GUIDE.md](./WINDOWS-GUIDE.md)
4. **Детали?** → Читайте [SQLMAP-AUTOMATION-README.md](./SQLMAP-AUTOMATION-README.md)

---

**Создано для тестирования безопасности Chat Diffie-Hellman API**
