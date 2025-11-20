#!/usr/bin/env python3
"""
SQLMap Automation Script for Chat Diffie-Hellman API
Автоматическое тестирование SQL-инъекций для всех эндпоинтов API
"""

import json
import os
import subprocess
import logging
from datetime import datetime
from typing import Dict, List, Any
import sys
from pathlib import Path

# Загрузка конфигурации из .env файла или переменных окружения
def load_config():
    """Загрузка конфигурации из файла или переменных окружения"""
    config = {
        'API_BASE_URL': os.getenv('API_BASE_URL', 'http://localhost:3000'),
        'JWT_TOKEN': os.getenv('JWT_TOKEN', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJzdWIiOiI3NDA2MjNhZS03Y2JlLTQ2ZjUtYWE1ZS1jN2UxZWI5N2EwYWIiLCJpYXQiOjE3NjI3Njk5NTh9.AA913lOFH0AtB_OwNOk3MlI-0plsazp3KEE3vapeeSk'),
        'TEST_USER_ID': os.getenv('TEST_USER_ID', '740623ae-7cbe-46f5-aa5e-c7e1eb97a0ab'),
        'SWAGGER_SPEC_PATH': os.getenv('SWAGGER_SPEC_PATH', '../swagger-spec.json'),
        'OUTPUT_DIR': os.getenv('OUTPUT_DIR', './sqlmap_results'),
        'LOG_FILE': os.getenv('LOG_FILE', './sqlmap_automation.log'),
        'SQLMAP_LEVEL': int(os.getenv('SQLMAP_LEVEL', '5')),
        'SQLMAP_RISK': int(os.getenv('SQLMAP_RISK', '3')),
        'SQLMAP_THREADS': int(os.getenv('SQLMAP_THREADS', '5')),
        'SQLMAP_TIMEOUT': int(os.getenv('SQLMAP_TIMEOUT', '600')),
        'SQLMAP_TECHNIQUES': os.getenv('SQLMAP_TECHNIQUES', 'BEUSTQ'),
    }
    
    # Попытка загрузить из config.env если существует
    config_file = Path(__file__).parent / 'config.env'
    if config_file.exists():
        with open(config_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    if key in config and key not in os.environ:
                        config[key] = value
    
    return config

# Загрузка конфигурации
CONFIG = load_config()
API_BASE_URL = CONFIG['API_BASE_URL']
JWT_TOKEN = CONFIG['JWT_TOKEN']
TEST_USER_ID = CONFIG['TEST_USER_ID']
SWAGGER_SPEC_PATH = CONFIG['SWAGGER_SPEC_PATH']
OUTPUT_DIR = CONFIG['OUTPUT_DIR']
LOG_FILE = CONFIG['LOG_FILE']

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)


class SQLMapAutomation:
    """Класс для автоматизации тестирования SQL-инъекций"""
    
    def __init__(self, base_url: str, jwt_token: str, swagger_path: str, output_dir: str):
        self.base_url = base_url.rstrip('/')
        self.jwt_token = jwt_token
        self.swagger_path = swagger_path
        self.output_dir = output_dir
        self.test_results = []
        
        # Создание директории для результатов
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Загрузка Swagger спецификации
        self.swagger_spec = self._load_swagger_spec()
        
    def _load_swagger_spec(self) -> Dict:
        """Загрузка Swagger спецификации"""
        try:
            with open(self.swagger_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Ошибка загрузки Swagger спецификации: {e}")
            sys.exit(1)
    
    def _get_example_body(self, endpoint_info: Dict) -> Dict:
        """Генерация примеров тела запроса на основе схемы"""
        if 'requestBody' not in endpoint_info:
            return None
        
        try:
            schema_ref = endpoint_info['requestBody']['content']['application/json']['schema']
            
            # Если это ссылка на схему
            if '$ref' in schema_ref:
                schema_name = schema_ref['$ref'].split('/')[-1]
                schema = self.swagger_spec['components']['schemas'][schema_name]
            else:
                schema = schema_ref
            
            # Генерация примера на основе схемы
            body = {}
            if 'properties' in schema:
                for prop_name, prop_info in schema['properties'].items():
                    if 'example' in prop_info:
                        body[prop_name] = prop_info['example']
                    elif prop_info.get('type') == 'string':
                        body[prop_name] = f"test_{prop_name}"
                    elif prop_info.get('type') == 'boolean':
                        body[prop_name] = True
                    elif prop_info.get('type') == 'number':
                        body[prop_name] = 1
            
            return body if body else None
        except Exception as e:
            logger.warning(f"Не удалось сгенерировать тело запроса: {e}")
            return None
    
    def _get_path_parameters(self, path: str, endpoint_info: Dict) -> Dict[str, str]:
        """Извлечение параметров пути"""
        params = {}
        if 'parameters' in endpoint_info:
            for param in endpoint_info['parameters']:
                if param['in'] == 'path':
                    param_name = param['name']
                    # Использование тестовых значений
                    if param_name in ['id', 'userId', 'chatId']:
                        params[param_name] = TEST_USER_ID
                    else:
                        params[param_name] = "test-value"
        return params
    
    def _replace_path_params(self, path: str, params: Dict[str, str]) -> str:
        """Замена параметров в пути"""
        for param_name, param_value in params.items():
            path = path.replace(f"{{{param_name}}}", param_value)
        return path
    
    def _run_sqlmap(self, method: str, url: str, data: Dict = None, 
                    endpoint_name: str = "", description: str = "") -> Dict:
        """Запуск SQLMap для конкретного эндпоинта"""
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_subdir = os.path.join(self.output_dir, f"{endpoint_name}_{timestamp}")
        os.makedirs(output_subdir, exist_ok=True)
        
        # Базовая команда SQLMap
        sqlmap_cmd = CONFIG.get('SQLMAP_CMD', 'sqlmap')
        if isinstance(sqlmap_cmd, list):
            cmd = sqlmap_cmd.copy()
        else:
            cmd = [sqlmap_cmd]
        
        cmd.extend([
            "-u", url,
            "--method", method,
            "--headers", f"Authorization: Bearer {self.jwt_token}",
            "--batch",  # Не задавать вопросы
            "--random-agent",  # Случайный User-Agent
            "--level", str(CONFIG['SQLMAP_LEVEL']),  # Уровень тестирования
            "--risk", str(CONFIG['SQLMAP_RISK']),  # Уровень риска
            "--threads", str(CONFIG['SQLMAP_THREADS']),  # Количество потоков
            "--output-dir", output_subdir,
            "--flush-session",  # Очистка сессии
            "--fresh-queries",  # Свежие запросы
            "--technique", CONFIG['SQLMAP_TECHNIQUES'],  # Техники
            "-v", "1",  # Вербозность
        ])
        
        # Добавление данных для POST/PUT/PATCH
        if data and method in ['POST', 'PUT', 'PATCH']:
            data_json = json.dumps(data)
            cmd.extend(["--data", data_json])
            cmd.extend(["--content-type", "application/json"])
        
        # Тестирование всех параметров
        if method == 'GET':
            cmd.append("--crawl=2")  # Сканирование связанных страниц
        
        logger.info(f"\n{'='*80}")
        logger.info(f"Тестирование: {endpoint_name}")
        logger.info(f"Описание: {description}")
        logger.info(f"URL: {url}")
        logger.info(f"Метод: {method}")
        if data:
            logger.info(f"Данные: {json.dumps(data, indent=2)}")
        logger.info(f"{'='*80}\n")
        
        # Сохранение информации о запросе
        request_info = {
            "endpoint": endpoint_name,
            "description": description,
            "url": url,
            "method": method,
            "data": data,
            "timestamp": timestamp,
            "command": " ".join(cmd)
        }
        
        with open(os.path.join(output_subdir, "request_info.json"), 'w', encoding='utf-8') as f:
            json.dump(request_info, f, indent=2, ensure_ascii=False)
        
        try:
            # Запуск SQLMap
            logger.info("Запуск SQLMap...")
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=CONFIG['SQLMAP_TIMEOUT']  # Таймаут из конфига
            )
            
            # Сохранение вывода
            with open(os.path.join(output_subdir, "stdout.log"), 'w', encoding='utf-8') as f:
                f.write(result.stdout)
            
            with open(os.path.join(output_subdir, "stderr.log"), 'w', encoding='utf-8') as f:
                f.write(result.stderr)
            
            # Анализ результатов
            vulnerable = self._analyze_results(result.stdout, result.stderr)
            
            test_result = {
                "endpoint": endpoint_name,
                "url": url,
                "method": method,
                "timestamp": timestamp,
                "vulnerable": vulnerable,
                "output_dir": output_subdir,
                "return_code": result.returncode
            }
            
            if vulnerable:
                logger.warning(f"⚠️  УЯЗВИМОСТЬ НАЙДЕНА: {endpoint_name}")
            else:
                logger.info(f"✓ Уязвимости не найдены: {endpoint_name}")
            
            return test_result
            
        except subprocess.TimeoutExpired:
            logger.error(f"Таймаут при тестировании {endpoint_name}")
            return {
                "endpoint": endpoint_name,
                "url": url,
                "method": method,
                "timestamp": timestamp,
                "vulnerable": False,
                "error": "timeout",
                "output_dir": output_subdir
            }
        except Exception as e:
            logger.error(f"Ошибка при тестировании {endpoint_name}: {e}")
            return {
                "endpoint": endpoint_name,
                "url": url,
                "method": method,
                "timestamp": timestamp,
                "vulnerable": False,
                "error": str(e),
                "output_dir": output_subdir
            }
    
    def _analyze_results(self, stdout: str, stderr: str) -> bool:
        """Анализ результатов SQLMap"""
        vulnerability_indicators = [
            "sqlmap identified the following injection point",
            "Parameter:",
            "Type:",
            "Title:",
            "Payload:",
            "vulnerable",
            "injection"
        ]
        
        output = stdout.lower() + stderr.lower()
        
        for indicator in vulnerability_indicators:
            if indicator.lower() in output:
                return True
        
        return False
    
    def test_all_endpoints(self):
        """Тестирование всех эндпоинтов из Swagger спецификации"""
        logger.info("="*80)
        logger.info("НАЧАЛО АВТОМАТИЗИРОВАННОГО ТЕСТИРОВАНИЯ SQL-ИНЪЕКЦИЙ")
        logger.info(f"Базовый URL: {self.base_url}")
        logger.info(f"Всего эндпоинтов: {len(self.swagger_spec['paths'])}")
        logger.info("="*80 + "\n")
        
        total_endpoints = 0
        vulnerable_endpoints = 0
        
        for path, methods in self.swagger_spec['paths'].items():
            for method, endpoint_info in methods.items():
                if method.upper() not in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']:
                    continue
                
                total_endpoints += 1
                
                try:
                    # Получение информации об эндпоинте
                    operation_id = endpoint_info.get('operationId', 'unknown')
                    summary = endpoint_info.get('summary', '')
                    description = endpoint_info.get('description', '')
                    
                    # Обработка параметров пути
                    path_params = self._get_path_parameters(path, endpoint_info)
                    full_path = self._replace_path_params(path, path_params)
                    full_url = f"{self.base_url}{full_path}"
                    
                    # Получение тела запроса
                    request_body = self._get_example_body(endpoint_info) if method.upper() in ['POST', 'PUT', 'PATCH'] else None
                    
                    # Запуск SQLMap
                    result = self._run_sqlmap(
                        method=method.upper(),
                        url=full_url,
                        data=request_body,
                        endpoint_name=operation_id,
                        description=summary or description
                    )
                    
                    self.test_results.append(result)
                    
                    if result.get('vulnerable', False):
                        vulnerable_endpoints += 1
                    
                except Exception as e:
                    logger.error(f"Ошибка при обработке {method.upper()} {path}: {e}")
        
        # Генерация финального отчета
        self._generate_final_report(total_endpoints, vulnerable_endpoints)
    
    def _generate_final_report(self, total: int, vulnerable: int):
        """Генерация финального отчета"""
        logger.info("\n" + "="*80)
        logger.info("ФИНАЛЬНЫЙ ОТЧЕТ")
        logger.info("="*80)
        logger.info(f"Всего протестировано эндпоинтов: {total}")
        logger.info(f"Найдено уязвимых эндпоинтов: {vulnerable}")
        logger.info(f"Безопасных эндпоинтов: {total - vulnerable}")
        logger.info("="*80 + "\n")
        
        # Сохранение результатов в JSON
        report_file = os.path.join(self.output_dir, f"final_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
        
        report = {
            "summary": {
                "total_endpoints": total,
                "vulnerable_endpoints": vulnerable,
                "safe_endpoints": total - vulnerable,
                "test_date": datetime.now().isoformat(),
                "base_url": self.base_url
            },
            "results": self.test_results
        }
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Отчет сохранен: {report_file}")
        
        # Список уязвимых эндпоинтов
        if vulnerable > 0:
            logger.warning("\n⚠️  УЯЗВИМЫЕ ЭНДПОИНТЫ:")
            for result in self.test_results:
                if result.get('vulnerable', False):
                    logger.warning(f"  - {result['method']} {result['url']}")
                    logger.warning(f"    Эндпоинт: {result['endpoint']}")
                    logger.warning(f"    Результаты: {result['output_dir']}\n")


def main():
    """Главная функция"""
    logger.info("SQLMap Automation Script v1.0")
    logger.info(f"Запуск: {datetime.now()}\n")
    
    # Проверка наличия SQLMap
    sqlmap_cmd = None
    try:
        # Попытка 1: sqlmap как команда
        result = subprocess.run(["sqlmap", "--version"], capture_output=True, timeout=5)
        if result.returncode == 0 or "sqlmap" in result.stdout.decode().lower():
            sqlmap_cmd = "sqlmap"
            logger.info(f"SQLMap найден: {sqlmap_cmd}")
    except:
        pass
    
    if not sqlmap_cmd:
        try:
            # Попытка 2: python3 sqlmap
            result = subprocess.run(["python3", "sqlmap", "--version"], capture_output=True, timeout=5)
            if result.returncode == 0 or "sqlmap" in result.stdout.decode().lower():
                sqlmap_cmd = ["python3", "sqlmap"]
                logger.info(f"SQLMap найден: python3 sqlmap")
        except:
            pass
    
    if not sqlmap_cmd:
        try:
            # Попытка 3: поиск в ~/Рабочий стол/sqlmap
            home_dir = os.path.expanduser("~")
            desktop_sqlmap = os.path.join(home_dir, "Рабочий стол", "sqlmap", "sqlmap.py")
            if os.path.exists(desktop_sqlmap):
                result = subprocess.run(["python3", desktop_sqlmap, "--version"], capture_output=True, timeout=5)
                if "sqlmap" in result.stdout.decode().lower():
                    sqlmap_cmd = ["python3", desktop_sqlmap]
                    logger.info(f"SQLMap найден: {desktop_sqlmap}")
        except:
            pass
    
    if not sqlmap_cmd:
        logger.error("SQLMap не установлен или недоступен")
        logger.error("Варианты установки:")
        logger.error("  1. sudo apt-get install sqlmap")
        logger.error("  2. git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git")
        logger.error("  3. Укажите путь в переменной SQLMAP_PATH")
        sys.exit(1)
    
    # Сохранение команды SQLMap в конфиг
    CONFIG['SQLMAP_CMD'] = sqlmap_cmd
    
    # Создание экземпляра автоматизации
    automation = SQLMapAutomation(
        base_url=API_BASE_URL,
        jwt_token=JWT_TOKEN,
        swagger_path=SWAGGER_SPEC_PATH,
        output_dir=OUTPUT_DIR
    )
    
    # Запуск тестирования
    try:
        automation.test_all_endpoints()
    except KeyboardInterrupt:
        logger.warning("\n\nТестирование прервано пользователем")
        sys.exit(1)
    except Exception as e:
        logger.error(f"\n\nКритическая ошибка: {e}")
        sys.exit(1)
    
    logger.info("\nТестирование завершено успешно!")


if __name__ == "__main__":
    main()
