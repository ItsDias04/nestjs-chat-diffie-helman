# Инструкции для Windows

## 🪟 SQLMap тестирование на Windows

Так как SQLMap лучше всего работает на Linux, есть несколько вариантов для Windows:

## Вариант 1: WSL (Рекомендуется)

### 1. Установка WSL

```powershell
# Запустите PowerShell от имени администратора
wsl --install

# Перезагрузите компьютер
```

### 2. Установка Ubuntu в WSL

```powershell
wsl --install -d Ubuntu
```

### 3. Настройка окружения в WSL

```bash
# В терминале WSL
sudo apt-get update
sudo apt-get install -y python3 sqlmap git curl
```

### 4. Запуск тестирования

```powershell
# В PowerShell в папке security-testing
.\run_sqlmap_tests.ps1
```

## Вариант 2: Docker

### 1. Установите Docker Desktop

Скачайте с [docker.com](https://www.docker.com/products/docker-desktop/)

### 2. Запустите контейнер

```powershell
# Перейдите в папку проекта
cd d:\nestjs-chat-diffie-helman\ChatDiffieHelman.Api\security-testing

# Запустите Ubuntu контейнер с монтированием папки
docker run -it --rm `
  -v "${PWD}:/workspace" `
  -w /workspace `
  --network host `
  ubuntu:22.04 /bin/bash
```

### 3. В контейнере выполните

```bash
# Установка зависимостей
apt-get update
apt-get install -y python3 sqlmap curl

# Запуск тестирования
chmod +x run_sqlmap_tests.sh
./run_sqlmap_tests.sh
```

## Вариант 3: Виртуальная машина

### 1. Установите VirtualBox

Скачайте с [virtualbox.org](https://www.virtualbox.org/)

### 2. Создайте VM с Ubuntu

- Скачайте Ubuntu ISO
- Создайте новую VM
- Установите Ubuntu

### 3. В Ubuntu выполните

```bash
# Скопируйте файлы проекта в VM
# Например, через общую папку или scp

cd /path/to/security-testing

# Установка зависимостей
sudo apt-get update
sudo apt-get install -y python3 sqlmap

# Запуск
chmod +x run_sqlmap_tests.sh
./run_sqlmap_tests.sh
```

## Вариант 4: Прямой запуск SQLMap на Windows (Не рекомендуется)

### 1. Установите Python

Скачайте с [python.org](https://www.python.org/downloads/)

### 2. Клонируйте SQLMap

```powershell
git clone https://github.com/sqlmapproject/sqlmap.git C:\sqlmap
```

### 3. Модифицируйте скрипт

Измените команды в `sqlmap_automation.py`:
```python
# Вместо "sqlmap" используйте
cmd = [
    "python", "C:/sqlmap/sqlmap.py",
    # ... остальные параметры
]
```

### 4. Запустите

```powershell
python sqlmap_automation.py
```

## 🎯 Рекомендация

**Используйте Вариант 1 (WSL)** - это самый простой и надежный способ для Windows.

## ✅ Проверка работы WSL

```powershell
# Проверка версии WSL
wsl --version

# Проверка установленных дистрибутивов
wsl -l -v

# Вход в WSL
wsl

# В WSL проверьте Python и SQLMap
python3 --version
sqlmap --version
```

## 🔧 Устранение проблем

### WSL не запускается

```powershell
# Включите функции Windows
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform

# Перезагрузите компьютер
```

### API недоступен из WSL

```powershell
# Используйте host.docker.internal вместо localhost
$env:API_BASE_URL = "http://host.docker.internal:3001"
```

Или найдите IP адрес Windows:
```powershell
ipconfig
# Используйте IPv4 адрес, например http://192.168.1.100:3001
```

## 📝 Примеры команд

### Запуск с пользовательскими параметрами

```powershell
# Установка переменных окружения
$env:API_BASE_URL = "http://localhost:3001"
$env:JWT_TOKEN = "your_token_here"

# Запуск через WSL
wsl python3 sqlmap_automation.py

# Или через PowerShell скрипт
.\run_sqlmap_tests.ps1
```

### Просмотр результатов

```powershell
# Просмотр логов
Get-Content sqlmap_automation.log -Tail 50

# Открыть папку с результатами
explorer sqlmap_results

# Генерация HTML отчета
wsl python3 generate_report.py (Get-ChildItem sqlmap_results/final_report_*.json | Select-Object -Last 1).FullName
```

## 💡 Полезные команды WSL

```powershell
# Запуск команды в WSL из PowerShell
wsl python3 --version

# Открыть текущую папку в WSL
wsl bash

# Конвертация Windows пути в WSL путь
wsl wslpath 'D:\nestjs-chat-diffie-helman\ChatDiffieHelman.Api\security-testing'

# Доступ к файлам Windows из WSL
# Windows диски доступны в /mnt/, например:
# D:\ -> /mnt/d/
```

---

**Для дополнительной информации см. [README-RU.md](./README-RU.md)**
