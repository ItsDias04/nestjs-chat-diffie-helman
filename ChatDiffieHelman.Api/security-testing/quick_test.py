#!/usr/bin/env python3
"""
SQLMap Quick Test - Быстрое тестирование отдельных эндпоинтов
"""

import json
import os
import subprocess
import sys
from pathlib import Path

# Конфигурация
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')
JWT_TOKEN = os.getenv('JWT_TOKEN', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk')
TEST_USER_ID = '740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab'


def test_endpoint(method: str, path: str, data: dict = None):
    """Быстрое тестирование одного эндпоинта"""
    
    url = f"{API_BASE_URL}{path}"
    
    print(f"\n{'='*80}")
    print(f"Тестирование: {method} {path}")
    print(f"URL: {url}")
    print(f"{'='*80}\n")
    
    # Определение команды sqlmap
    sqlmap_cmd = None
    try:
        result = subprocess.run(["sqlmap", "--version"], capture_output=True, timeout=5)
        if result.returncode == 0 or "sqlmap" in result.stdout.decode().lower():
            sqlmap_cmd = ["sqlmap"]
    except:
        pass
    
    if not sqlmap_cmd:
        try:
            result = subprocess.run(["python3", "sqlmap", "--version"], capture_output=True, timeout=5)
            if result.returncode == 0 or "sqlmap" in result.stdout.decode().lower():
                sqlmap_cmd = ["python3", "sqlmap"]
        except:
            pass
    
    if not sqlmap_cmd:
        home_dir = os.path.expanduser("~")
        desktop_sqlmap = os.path.join(home_dir, "Рабочий стол", "sqlmap", "sqlmap.py")
        if os.path.exists(desktop_sqlmap):
            sqlmap_cmd = ["python3", desktop_sqlmap]
    
    if not sqlmap_cmd:
        print("Ошибка: SQLMap не найден!")
        print("Установите: sudo apt-get install sqlmap")
        return
    
    cmd = sqlmap_cmd + [
        "-u", url,
        "--method", method,
        "--headers", f"Authorization: Bearer {JWT_TOKEN}",
        "--batch",
        "--random-agent",
        "--level", "3",  # Средний уровень для быстрого теста
        "--risk", "2",
        "-v", "1",
    ]
    
    if data and method in ['POST', 'PUT', 'PATCH']:
        data_json = json.dumps(data)
        cmd.extend(["--data", data_json])
        cmd.extend(["--content-type", "application/json"])
        print(f"Body: {data_json}\n")
    
    print("Запуск SQLMap...\n")
    print(f"Команда: {' '.join(cmd)}\n")
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\n\nТестирование прервано пользователем")
    except Exception as e:
        print(f"\n\nОшибка: {e}")


def main():
    """Главная функция с примерами"""
    
    if len(sys.argv) < 2:
        print("SQLMap Quick Test - Быстрое тестирование отдельных эндпоинтов")
        print("\nИспользование:")
        print("  python3 quick_test.py <test_name>")
        print("\nДоступные тесты:")
        print("  1  - GET /users/all (Получить всех пользователей)")
        print("  2  - GET /users/me (Получить текущего пользователя)")
        print("  3  - GET /users/{id} (Получить пользователя по ID)")
        print("  4  - POST /auth/login (Вход в систему)")
        print("  5  - POST /users/registration (Регистрация)")
        print("  6  - GET /chats (Получить мои чаты)")
        print("  7  - POST /chats (Создать чат)")
        print("  8  - GET /chats/{chatId} (Получить чат по ID)")
        print("  9  - GET /messages/{chatId} (Получить сообщения)")
        print("  10 - POST /messages/{chatId} (Отправить сообщение)")
        print("  11 - GET /invites (Получить приглашения)")
        print("  12 - POST /invites/create (Создать приглашение)")
        print("\nПример:")
        print("  python3 quick_test.py 1")
        print("  python3 quick_test.py 4")
        return
    
    test_num = sys.argv[1]
    
    tests = {
        '1': {
            'method': 'GET',
            'path': '/users/all',
        },
        '2': {
            'method': 'GET',
            'path': '/users/me',
        },
        '3': {
            'method': 'GET',
            'path': f'/users/{TEST_USER_ID}',
        },
        '4': {
            'method': 'POST',
            'path': '/auth/login',
            'data': {
                'email': 'test@example.com',
                'password': 'testPassword123'
            }
        },
        '5': {
            'method': 'POST',
            'path': '/users/registration',
            'data': {
                'username': 'newuser',
                'email': 'newuser@example.com',
                'password': 'newPassword123'
            }
        },
        '6': {
            'method': 'GET',
            'path': '/chats',
        },
        '7': {
            'method': 'POST',
            'path': '/chats',
            'data': {
                'name': 'Test Chat'
            }
        },
        '8': {
            'method': 'GET',
            'path': f'/chats/{TEST_USER_ID}',
        },
        '9': {
            'method': 'GET',
            'path': f'/messages/{TEST_USER_ID}',
        },
        '10': {
            'method': 'POST',
            'path': f'/messages/{TEST_USER_ID}',
            'data': {
                'content': 'Test message',
                'type': 'text'
            }
        },
        '11': {
            'method': 'GET',
            'path': '/invites',
        },
        '12': {
            'method': 'POST',
            'path': '/invites/create',
            'data': {
                'chatId': TEST_USER_ID,
                'userReceiverId': TEST_USER_ID
            }
        },
    }
    
    if test_num not in tests:
        print(f"Ошибка: Тест '{test_num}' не найден")
        print("Используйте: python3 quick_test.py для списка доступных тестов")
        return
    
    test = tests[test_num]
    test_endpoint(test['method'], test['path'], test.get('data'))


if __name__ == "__main__":
    main()
