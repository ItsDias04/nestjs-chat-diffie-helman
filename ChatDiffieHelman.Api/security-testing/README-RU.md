# 🔒 SQLMap Автоматическое Тестирование Безопасности

## 📝 Описание

Автоматизированное тестирование всех эндпоинтов Chat Diffie-Hellman API на SQL-инъекции.

## 🚀 Быстрый старт (Ubuntu)

### 1. Установка SQLMap

```bash
sudo apt-get update
sudo apt-get install -y sqlmap python3
```

### 2. Настройка конфигурации

Отредактируйте `config.env`:

```bash
nano config.env
```

Укажите:
- `API_BASE_URL` - URL вашего API (по умолчанию: http://localhost:3001)
- `JWT_TOKEN` - ваш JWT токен
- `TEST_USER_ID` - ID тестового пользователя

### 3. Запуск тестирования

```bash
# Дать права на выполнение
chmod +x run_sqlmap_tests.sh

# Запустить
./run_sqlmap_tests.sh
```

## 📊 Результаты

После выполнения:
- **Логи**: `sqlmap_automation.log`
- **Результаты**: `sqlmap_results/`
- **Отчет**: `sqlmap_results/final_report_*.json`

### Генерация HTML отчета

```bash
python3 generate_report.py sqlmap_results/final_report_*.json
```

## 🔍 Быстрое тестирование отдельного эндпоинта

```bash
# Просмотр доступных тестов
python3 quick_test.py

# Запуск конкретного теста (например, тест #4 - логин)
python3 quick_test.py 4
```

## 📁 Структура файлов

```
security-testing/
├── sqlmap_automation.py           # Основной скрипт
├── run_sqlmap_tests.sh            # Bash скрипт запуска
├── quick_test.py                  # Быстрое тестирование
├── generate_report.py             # Генератор HTML отчетов
├── config.env                     # Конфигурация
├── README-RU.md                   # Эта документация
├── SQLMAP-AUTOMATION-README.md    # Детальная документация
└── SQLMAP-GUIDE.md                # Оригинальное руководство
```

## 🎯 Тестируемые эндпоинты

- ✅ **Users**: Регистрация, получение пользователей
- ✅ **Auth**: Логин, Fiat-Shamir, BMC протоколы
- ✅ **Chats**: Создание, получение чатов
- ✅ **Messages**: Отправка, получение сообщений
- ✅ **Invites**: Приглашения в чаты

Всего: **23 эндпоинта**

## ⚙️ Параметры тестирования

По умолчанию используются:
- **Level**: 5 (максимальный)
- **Risk**: 3 (максимальный)
- **Threads**: 5
- **Timeout**: 600 секунд
- **Techniques**: BEUSTQ (все техники)

Настройка в `config.env`

## 📖 Примеры использования

### Базовый запуск

```bash
./run_sqlmap_tests.sh
```

### С пользовательским URL

```bash
API_BASE_URL=http://192.168.1.100:3001 ./run_sqlmap_tests.sh
```

### Запуск с другим токеном

```bash
JWT_TOKEN=your_new_token python3 sqlmap_automation.py
```

## 🛠️ Устранение неполадок

### SQLMap не найден

```bash
sudo apt-get install sqlmap
# или
pip3 install sqlmap-python
```

### API недоступен

```bash
# Проверьте, запущен ли сервер
curl http://localhost:3001/users/all
```

### Ошибка авторизации

Проверьте JWT токен:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/users/me
```

## 📚 Дополнительная документация

- [SQLMAP-AUTOMATION-README.md](./SQLMAP-AUTOMATION-README.md) - Детальная документация
- [SQLMAP-GUIDE.md](./SQLMAP-GUIDE.md) - Оригинальное руководство
- [Официальная документация SQLMap](https://github.com/sqlmapproject/sqlmap/wiki)

## ⚠️ Важно

- ❌ **НЕ запускайте на production окружении!**
- ✅ Используйте только на тестовых серверах
- ✅ Получите разрешение перед тестированием
- ✅ Сделайте backup базы данных

## 📧 Поддержка

При возникновении проблем:
1. Проверьте логи: `sqlmap_automation.log`
2. Просмотрите детали в `sqlmap_results/`
3. Изучите документацию в `SQLMAP-AUTOMATION-README.md`

---

**Создано для учебных целей тестирования безопасности Chat Diffie-Hellman API**
