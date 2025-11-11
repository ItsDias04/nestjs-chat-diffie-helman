#!/usr/bin/env python3
"""
Автоматическое тестирование всех эндпоинтов API с помощью sqlmap
Читает swagger-spec.json и определяет, какие эндпоинты требуют JWT токен

Требования:
- Python 3.6+
- sqlmap установлен в системе
- Запущен API сервер (http://localhost:3000)

Использование:
    python3 sqlmap-auto-test.py
    python3 sqlmap-auto-test.py --token YOUR_JWT_TOKEN
    python3 sqlmap-auto-test.py --swagger-url http://localhost:3000/api-json
"""

import json
import subprocess
import sys
import argparse
import os
import time
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import requests
from pathlib import Path


class Colors:
    """ANSI цвета для красивого вывода"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


class SQLMapTester:
    def __init__(self, api_url: str = "http://localhost:3000", jwt_token: Optional[str] = None):
        self.api_url = api_url.rstrip('/')
        self.jwt_token = jwt_token
        self.swagger_spec = None
        self.results_dir = Path("sqlmap-results")
        self.results_dir.mkdir(exist_ok=True)
        
        # Тестовые учетные данные
        self.test_user = {
            "id": "740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab",
            "username": "test user",
            "email": "test@example.com",
            "password": "testPassword123"
        }
        
        # Статистика
        self.total_endpoints = 0
        self.tested_endpoints = 0
        self.vulnerable_endpoints = []
        self.failed_tests = []
        self.skipped_endpoints = []

    def log(self, message: str, color: str = Colors.OKBLUE):
        """Цветной вывод в консоль"""
        print(f"{color}{message}{Colors.ENDC}")

    def load_swagger_spec(self, swagger_url: Optional[str] = None) -> bool:
        """Загружает Swagger спецификацию"""
        if swagger_url is None:
            swagger_url = f"{self.api_url}/api-json"
        
        self.log(f"\n📄 Загрузка Swagger спецификации: {swagger_url}", Colors.OKCYAN)
        
        try:
            # Попробовать загрузить из URL
            response = requests.get(swagger_url, timeout=10)
            response.raise_for_status()
            self.swagger_spec = response.json()
            self.log("✅ Swagger спецификация загружена из API", Colors.OKGREEN)
            return True
        except Exception as e:
            self.log(f"⚠️  Не удалось загрузить из API: {e}", Colors.WARNING)
            
            # Попробовать загрузить из файла
            try:
                swagger_file = Path("../swagger-spec.json")
                if not swagger_file.exists():
                    swagger_file = Path("swagger-spec.json")
                
                if swagger_file.exists():
                    with open(swagger_file, 'r', encoding='utf-8') as f:
                        self.swagger_spec = json.load(f)
                    self.log(f"✅ Swagger спецификация загружена из файла: {swagger_file}", Colors.OKGREEN)
                    return True
                else:
                    self.log("❌ Файл swagger-spec.json не найден!", Colors.FAIL)
                    return False
            except Exception as file_error:
                self.log(f"❌ Ошибка чтения файла: {file_error}", Colors.FAIL)
                return False

    def requires_jwt(self, path: str, method: str) -> bool:
        """Проверяет, требует ли эндпоинт JWT токен"""
        if not self.swagger_spec or 'paths' not in self.swagger_spec:
            return False
        
        # Получаем информацию об эндпоинте
        path_info = self.swagger_spec['paths'].get(path, {})
        method_info = path_info.get(method.lower(), {})
        
        # Проверяем наличие security требований
        security = method_info.get('security', [])
        
        # Если есть глобальная security
        if not security and 'security' in self.swagger_spec:
            security = self.swagger_spec['security']
        
        # Проверяем, требуется ли Bearer token
        for sec_req in security:
            if 'access-token' in sec_req or 'bearer' in sec_req or 'Bearer' in sec_req:
                return True
        
        return False

    def get_endpoints(self) -> List[Tuple[str, str, str, bool]]:
        """Извлекает все эндпоинты из Swagger спецификации
        
        Returns:
            List of tuples: (path, method, summary, requires_jwt)
        """
        if not self.swagger_spec or 'paths' not in self.swagger_spec:
            return []
        
        endpoints = []
        
        for path, methods in self.swagger_spec['paths'].items():
            for method, details in methods.items():
                if method.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                    summary = details.get('summary', 'No description')
                    requires_jwt = self.requires_jwt(path, method)
                    endpoints.append((path, method.upper(), summary, requires_jwt))
        
        return endpoints

    def get_jwt_token(self) -> Optional[str]:
        """Получает JWT токен через логин (если не предоставлен)"""
        if self.jwt_token:
            return self.jwt_token
        
        self.log("\n🔑 JWT токен не предоставлен. Попытка автоматического получения...", Colors.WARNING)
        
        # Сначала попытка зарегистрировать тестового пользователя
        self.log("   📝 Попытка регистрации тестового пользователя...", Colors.OKBLUE)
        try:
            register_data = {
                "username": self.test_user["username"],
                "email": self.test_user["email"],
                "password": self.test_user["password"]
            }
            
            register_response = requests.post(
                f"{self.api_url}/users/registration",
                json=register_data,
                timeout=10
            )
            
            if register_response.status_code == 201:
                self.log("   ✅ Тестовый пользователь зарегистрирован", Colors.OKGREEN)
            elif register_response.status_code == 409:
                self.log("   ℹ️  Тестовый пользователь уже существует", Colors.OKBLUE)
            else:
                self.log(f"   ⚠️  Регистрация вернула статус {register_response.status_code}", Colors.WARNING)
        except Exception as e:
            self.log(f"   ⚠️  Ошибка регистрации: {e}", Colors.WARNING)
        
        # Попытка войти с тестовыми учетными данными
        self.log("   🔐 Попытка входа с тестовыми учетными данными...", Colors.OKBLUE)
        login_data = {
            "email": self.test_user["email"],
            "password": self.test_user["password"]
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                if token:
                    self.jwt_token = token
                    self.log("   ✅ JWT токен получен автоматически", Colors.OKGREEN)
                    self.log(f"   🔑 Токен: {token[:50]}...", Colors.OKBLUE)
                    return token
                else:
                    self.log("   ⚠️  Ответ не содержит access_token", Colors.WARNING)
            else:
                self.log(f"   ⚠️  Логин вернул статус {response.status_code}", Colors.WARNING)
                self.log(f"   📄 Ответ: {response.text[:200]}", Colors.WARNING)
        except Exception as e:
            self.log(f"   ⚠️  Не удалось получить токен автоматически: {e}", Colors.WARNING)
        
        self.log("   ℹ️  Вы можете указать токен явно: --token YOUR_TOKEN", Colors.OKCYAN)
        return None

    def prepare_sqlmap_command(self, path: str, method: str, requires_jwt: bool) -> List[str]:
        """Подготавливает команду sqlmap для эндпоинта"""
        url = f"{self.api_url}{path}"
        
        # Базовая команда
        cmd = [
            "sqlmap",
            "-u", url,
            "--method", method,
            "--batch",  # Не запрашивать подтверждения
            "--level=2",  # Уровень тестирования
            "--risk=1",  # Уровень риска
            "--threads=5",  # Количество потоков
            "--technique=BEUSTQ",  # Все техники
            "--random-agent",  # Случайный User-Agent
        ]
        
        # Добавляем JWT токен если требуется
        if requires_jwt and self.jwt_token:
            cmd.extend([
                "--header", f"Authorization: Bearer {self.jwt_token}"
            ])
        
        # Добавляем Content-Type для POST/PUT/PATCH
        if method in ['POST', 'PUT', 'PATCH']:
            cmd.extend([
                "--header", "Content-Type: application/json"
            ])
        
        # Параметры для тестирования
        # Если есть параметры пути, заменяем их на тестовые значения
        if '{' in path:
            # Заменяем {id}, {userId}, {chatId} и т.д. на тестовый UUID
            test_uuid = self.test_user["id"]
            url_with_params = path
            import re
            url_with_params = re.sub(r'\{[^}]+\}', test_uuid, url_with_params)
            cmd[2] = f"{self.api_url}{url_with_params}"
        
        # Для POST запросов добавляем тестовые данные в зависимости от эндпоинта
        if method == 'POST':
            test_data = self._get_test_data_for_endpoint(path)
            if test_data:
                cmd.extend(["--data", test_data])
        
        return cmd

    def _get_test_data_for_endpoint(self, path: str) -> str:
        """Возвращает тестовые данные для конкретного эндпоинта"""
        
        # Данные для регистрации
        if 'registration' in path:
            return json.dumps({
                "username": "SQL Injection Test User",
                "email": "sqltest@example.com",
                "password": "testPassword123"
            })
        
        # Данные для логина
        if 'login' in path:
            return json.dumps({
                "email": self.test_user["email"],
                "password": self.test_user["password"]
            })
        
        # Данные для создания чата
        if path == '/chats' or 'chats' in path:
            return json.dumps({
                "name": "Test Chat Room"
            })
        
        # Данные для сообщений
        if 'messages' in path:
            return json.dumps({
                "content": "Test message content",
                "type": "text",
                "chatId": self.test_user["id"],
                "userId": self.test_user["id"],
                "reviewed": False
            })
        
        # Данные для приглашений
        if 'invites/create' in path:
            return json.dumps({
                "chatId": self.test_user["id"],
                "userReceiverId": self.test_user["id"]
            })
        
        if 'invites/respond' in path:
            return json.dumps({
                "inviteId": self.test_user["id"],
                "accept": True
            })
        
        # Данные для Fiat-Shamir
        if 'fiat/start' in path:
            return json.dumps({
                "sid": "test-session-id",
                "t": "123456789"
            })
        
        if 'fiat/finish' in path:
            return json.dumps({
                "sid": "test-session-id",
                "r": "987654321"
            })
        
        if 'fiat/enable' in path:
            return json.dumps({
                "v": "1234567890",
                "n": "9876543210"
            })
        
        # Данные для BMC
        if 'bmc/start' in path:
            return json.dumps({
                "sid": "test-session-id",
                "a": "123456789"
            })
        
        if 'bmc/finish' in path:
            return json.dumps({
                "sid": "test-session-id",
                "e": "987654321"
            })
        
        if 'bmc/enable' in path:
            return json.dumps({
                "n": "1234567890",
                "g": "9876543210",
                "y": "5555555555"
            })
        
        # Общие тестовые данные с потенциально уязвимыми полями
        return json.dumps({
            "id": self.test_user["id"],
            "name": "Test Name",
            "email": self.test_user["email"],
            "password": self.test_user["password"],
            "username": self.test_user["username"]
        })

    def run_sqlmap_test(self, path: str, method: str, summary: str, requires_jwt: bool) -> Dict:
        """Запускает sqlmap тест для одного эндпоинта"""
        self.log(f"\n{'='*80}", Colors.OKCYAN)
        self.log(f"🔍 Тестирование: {method} {path}", Colors.BOLD)
        self.log(f"   Описание: {summary}", Colors.OKBLUE)
        self.log(f"   Требует JWT: {'✅ Да' if requires_jwt else '❌ Нет'}", Colors.OKBLUE)
        
        # Если требуется JWT, но его нет - пропускаем
        if requires_jwt and not self.jwt_token:
            self.log("   ⚠️  Пропущено: нет JWT токена", Colors.WARNING)
            self.skipped_endpoints.append((path, method, "No JWT token"))
            return {"status": "skipped", "reason": "No JWT token"}
        
        # Подготовка команды
        cmd = self.prepare_sqlmap_command(path, method, requires_jwt)
        
        # Вывод команды
        self.log(f"   💻 Команда: {' '.join(cmd)}", Colors.OKBLUE)
        
        # Создаем директорию для результатов этого эндпоинта
        safe_path = path.replace('/', '_').replace('{', '').replace('}', '')
        endpoint_dir = self.results_dir / f"{method}_{safe_path}"
        endpoint_dir.mkdir(exist_ok=True)
        
        # Файл для логов
        log_file = endpoint_dir / f"sqlmap_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        try:
            # Запуск sqlmap
            start_time = time.time()
            
            with open(log_file, 'w') as f:
                process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    universal_newlines=True
                )
                
                # Читаем вывод в реальном времени
                for line in process.stdout:
                    f.write(line)
                    # Показываем важные строки
                    if 'vulnerable' in line.lower() or 'injectable' in line.lower():
                        self.log(f"   ⚠️  {line.strip()}", Colors.WARNING)
                
                process.wait()
            
            elapsed = time.time() - start_time
            
            # Анализ результатов
            with open(log_file, 'r') as f:
                output = f.read()
            
            is_vulnerable = 'is vulnerable' in output.lower() or 'injectable' in output.lower()
            
            result = {
                "status": "completed",
                "vulnerable": is_vulnerable,
                "elapsed_time": elapsed,
                "log_file": str(log_file)
            }
            
            if is_vulnerable:
                self.log(f"   🚨 УЯЗВИМОСТЬ ОБНАРУЖЕНА!", Colors.FAIL)
                self.vulnerable_endpoints.append((path, method, summary))
            else:
                self.log(f"   ✅ Уязвимости не обнаружены", Colors.OKGREEN)
            
            self.log(f"   ⏱️  Время выполнения: {elapsed:.2f} сек", Colors.OKBLUE)
            self.log(f"   📄 Лог сохранен: {log_file}", Colors.OKBLUE)
            
            return result
            
        except FileNotFoundError:
            self.log("   ❌ sqlmap не найден! Установите: sudo apt-get install sqlmap", Colors.FAIL)
            self.failed_tests.append((path, method, "sqlmap not found"))
            return {"status": "error", "reason": "sqlmap not found"}
        
        except Exception as e:
            self.log(f"   ❌ Ошибка: {e}", Colors.FAIL)
            self.failed_tests.append((path, method, str(e)))
            return {"status": "error", "reason": str(e)}

    def generate_report(self):
        """Генерирует финальный отчет"""
        self.log(f"\n{'='*80}", Colors.HEADER)
        self.log("📊 ИТОГОВЫЙ ОТЧЕТ", Colors.HEADER + Colors.BOLD)
        self.log(f"{'='*80}\n", Colors.HEADER)
        
        self.log(f"Всего эндпоинтов: {self.total_endpoints}", Colors.OKBLUE)
        self.log(f"Протестировано: {self.tested_endpoints}", Colors.OKBLUE)
        self.log(f"Пропущено: {len(self.skipped_endpoints)}", Colors.WARNING)
        self.log(f"Ошибок: {len(self.failed_tests)}", Colors.FAIL)
        
        if self.vulnerable_endpoints:
            self.log(f"\n🚨 ОБНАРУЖЕНО УЯЗВИМОСТЕЙ: {len(self.vulnerable_endpoints)}", Colors.FAIL + Colors.BOLD)
            for path, method, summary in self.vulnerable_endpoints:
                self.log(f"   - {method} {path}", Colors.FAIL)
                self.log(f"     {summary}", Colors.FAIL)
        else:
            self.log(f"\n✅ УЯЗВИМОСТИ НЕ ОБНАРУЖЕНЫ", Colors.OKGREEN + Colors.BOLD)
        
        if self.skipped_endpoints:
            self.log(f"\n⚠️  Пропущенные эндпоинты:", Colors.WARNING)
            for path, method, reason in self.skipped_endpoints:
                self.log(f"   - {method} {path} ({reason})", Colors.WARNING)
        
        if self.failed_tests:
            self.log(f"\n❌ Ошибки тестирования:", Colors.FAIL)
            for path, method, reason in self.failed_tests:
                self.log(f"   - {method} {path} ({reason})", Colors.FAIL)
        
        self.log(f"\n📁 Результаты сохранены в: {self.results_dir.absolute()}", Colors.OKCYAN)
        
        # Сохранение JSON отчета
        report = {
            "timestamp": datetime.now().isoformat(),
            "api_url": self.api_url,
            "total_endpoints": self.total_endpoints,
            "tested_endpoints": self.tested_endpoints,
            "vulnerable_count": len(self.vulnerable_endpoints),
            "vulnerable_endpoints": [
                {"path": p, "method": m, "summary": s}
                for p, m, s in self.vulnerable_endpoints
            ],
            "skipped_endpoints": [
                {"path": p, "method": m, "reason": r}
                for p, m, r in self.skipped_endpoints
            ],
            "failed_tests": [
                {"path": p, "method": m, "reason": r}
                for p, m, r in self.failed_tests
            ]
        }
        
        report_file = self.results_dir / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        self.log(f"📄 JSON отчет: {report_file}", Colors.OKCYAN)

    def run(self):
        """Основная функция запуска тестирования"""
        self.log(f"\n{'='*80}", Colors.HEADER)
        self.log("🔐 SQLMap Автоматическое Тестирование API", Colors.HEADER + Colors.BOLD)
        self.log(f"{'='*80}\n", Colors.HEADER)
        
        # Загрузка спецификации
        if not self.load_swagger_spec():
            self.log("❌ Не удалось загрузить Swagger спецификацию!", Colors.FAIL)
            return False
        
        # Получение эндпоинтов
        endpoints = self.get_endpoints()
        self.total_endpoints = len(endpoints)
        
        if not endpoints:
            self.log("❌ Эндпоинты не найдены!", Colors.FAIL)
            return False
        
        self.log(f"✅ Найдено эндпоинтов: {self.total_endpoints}", Colors.OKGREEN)
        
        # Статистика по JWT
        jwt_required_count = sum(1 for _, _, _, req_jwt in endpoints if req_jwt)
        self.log(f"   - Требуют JWT: {jwt_required_count}", Colors.OKBLUE)
        self.log(f"   - Публичные: {self.total_endpoints - jwt_required_count}", Colors.OKBLUE)
        
        # Попытка получить JWT токен если нужно
        if jwt_required_count > 0:
            self.get_jwt_token()
        
        # Подтверждение начала тестирования
        self.log(f"\n⚠️  Начинаем тестирование {self.total_endpoints} эндпоинтов...", Colors.WARNING)
        self.log("   Это может занять продолжительное время!", Colors.WARNING)
        
        try:
            input("\nНажмите Enter для продолжения или Ctrl+C для отмены...")
        except KeyboardInterrupt:
            self.log("\n❌ Тестирование отменено пользователем", Colors.FAIL)
            return False
        
        # Тестирование каждого эндпоинта
        for path, method, summary, requires_jwt in endpoints:
            result = self.run_sqlmap_test(path, method, summary, requires_jwt)
            if result['status'] == 'completed':
                self.tested_endpoints += 1
        
        # Генерация отчета
        self.generate_report()
        
        return True


def main():
    parser = argparse.ArgumentParser(
        description='Автоматическое тестирование API с помощью sqlmap',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры использования:
  python3 sqlmap-auto-test.py
  python3 sqlmap-auto-test.py --token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  python3 sqlmap-auto-test.py --api-url http://localhost:3000
  python3 sqlmap-auto-test.py --swagger-url http://localhost:3000/api-json
  
  # Использование тестового токена из БД
  python3 sqlmap-auto-test.py --token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk
  
  # Автоматическое получение токена (использует test@example.com / testPassword123)
  python3 sqlmap-auto-test.py --auto-register

Установка зависимостей:
  sudo apt-get install sqlmap python3-requests
  pip3 install requests
        """
    )
    
    parser.add_argument(
        '--api-url',
        default='http://localhost:3000',
        help='URL API сервера (по умолчанию: http://localhost:3000)'
    )
    
    parser.add_argument(
        '--token',
        help='JWT токен для авторизации (опционально)'
    )
    
    parser.add_argument(
        '--swagger-url',
        help='URL Swagger спецификации (опционально, по умолчанию: API_URL/api-json)'
    )
    
    args = parser.parse_args()
    
    # Создание тестера
    tester = SQLMapTester(
        api_url=args.api_url,
        jwt_token=args.token
    )
    
    # Запуск тестирования
    success = tester.run()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
