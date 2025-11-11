# 🚀 Быстрый старт - SQLMap тестирование

## Для Linux/Ubuntu

### 1. Установка зависимостей

```bash
# SQLMap
sudo apt-get update
sudo apt-get install sqlmap

# Python зависимости
pip3 install requests
```

### 2. Запуск API

```bash
# В корневой директории проекта
cd ..
npm run start:dev
```

### 3. Запуск тестирования

#### Вариант A: Bash скрипт (рекомендуется)

```bash
cd security-testing
chmod +x run-sqlmap-test.sh
./run-sqlmap-test.sh
```

Скрипт автоматически:
- ✅ Зарегистрирует тестового пользователя
- ✅ Получит JWT токен
- ✅ Протестирует все эндпоинты

#### Вариант B: Python скрипт

```bash
cd security-testing
python3 sqlmap-auto-test.py
```

#### Вариант C: С существующим токеном

```bash
# Использовать токен из БД
./run-sqlmap-test.sh --known-token

# Или свой токен
./run-sqlmap-test.sh --token "YOUR_JWT_TOKEN"
```

---

## 📋 Тестовый пользователь

По умолчанию используется:

```
Email:    test@example.com
Password: testPassword123
User ID:  740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab
```

JWT токен (может быть устаревшим):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk
```

---

## 📊 Результаты

После завершения:
- Логи: `sqlmap-results/`
- Отчет: `sqlmap-results/report_YYYYMMDD_HHMMSS.json`

---

## ❓ Проблемы?

### API не запущен
```bash
curl http://localhost:3000/
# Если ошибка - запустите: npm run start:dev
```

### sqlmap не установлен
```bash
sudo apt-get install sqlmap
```

### Python зависимости
```bash
pip3 install requests
```

---

**Полная документация:** [SQLMAP-AUTO-README.md](./SQLMAP-AUTO-README.md)
