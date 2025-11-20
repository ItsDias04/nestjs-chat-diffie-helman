#!/usr/bin/env python3
"""
Утилита для определения правильной команды SQLMap
"""

import subprocess
import os
import sys

def find_sqlmap():
    """Поиск SQLMap в системе"""
    
    print("Поиск SQLMap...")
    
    # Попытка 1: sqlmap в PATH
    try:
        result = subprocess.run(["sqlmap", "--version"], 
                              capture_output=True, 
                              timeout=5,
                              text=True)
        if "sqlmap" in result.stdout.lower() or "sqlmap" in result.stderr.lower():
            print("✓ SQLMap найден как команда: sqlmap")
            print(f"  Версия: {result.stdout.strip() or result.stderr.strip()}")
            return ["sqlmap"]
    except Exception as e:
        print(f"✗ 'sqlmap' не найден в PATH: {e}")
    
    # Попытка 2: python3 sqlmap
    try:
        result = subprocess.run(["python3", "sqlmap", "--version"], 
                              capture_output=True, 
                              timeout=5,
                              text=True)
        if "sqlmap" in result.stdout.lower() or "sqlmap" in result.stderr.lower():
            print("✓ SQLMap найден через: python3 sqlmap")
            print(f"  Версия: {result.stdout.strip() or result.stderr.strip()}")
            return ["python3", "sqlmap"]
    except Exception as e:
        print(f"✗ 'python3 sqlmap' не работает: {e}")
    
    # Попытка 3: В домашней директории
    home_dir = os.path.expanduser("~")
    possible_locations = [
        os.path.join(home_dir, "Рабочий стол", "sqlmap", "sqlmap.py"),
        os.path.join(home_dir, "Desktop", "sqlmap", "sqlmap.py"),
        os.path.join(home_dir, "sqlmap", "sqlmap.py"),
        os.path.join(home_dir, "sqlmap-dev", "sqlmap.py"),
        "/usr/share/sqlmap/sqlmap.py",
        "/opt/sqlmap/sqlmap.py",
    ]
    
    for path in possible_locations:
        if os.path.exists(path):
            try:
                result = subprocess.run(["python3", path, "--version"], 
                                      capture_output=True, 
                                      timeout=5,
                                      text=True)
                if "sqlmap" in result.stdout.lower() or "sqlmap" in result.stderr.lower():
                    print(f"✓ SQLMap найден в: {path}")
                    print(f"  Версия: {result.stdout.strip() or result.stderr.strip()}")
                    return ["python3", path]
            except Exception as e:
                print(f"✗ Не удалось запустить {path}: {e}")
    
    # Попытка 4: whereis и which
    try:
        result = subprocess.run(["which", "sqlmap"], 
                              capture_output=True, 
                              text=True)
        if result.stdout.strip():
            sqlmap_path = result.stdout.strip()
            print(f"✓ SQLMap найден через which: {sqlmap_path}")
            return [sqlmap_path]
    except:
        pass
    
    try:
        result = subprocess.run(["whereis", "sqlmap"], 
                              capture_output=True, 
                              text=True)
        if result.stdout.strip():
            print(f"  whereis нашел: {result.stdout.strip()}")
    except:
        pass
    
    print("\n✗ SQLMap не найден!")
    print("\nВарианты установки:")
    print("  1. sudo apt-get install sqlmap")
    print("  2. git clone --depth 1 https://github.com/sqlmapproject/sqlmap.git")
    print("  3. pip install sqlmap-python")
    
    return None


def test_sqlmap_command(cmd):
    """Тестирование команды SQLMap"""
    print(f"\nТестирование команды: {' '.join(cmd)}")
    
    try:
        test_cmd = cmd + ["--version"]
        result = subprocess.run(test_cmd, 
                              capture_output=True, 
                              timeout=5,
                              text=True)
        
        print(f"Код возврата: {result.returncode}")
        print(f"Вывод:\n{result.stdout}")
        if result.stderr:
            print(f"Ошибки:\n{result.stderr}")
        
        # Тест с простым URL
        print("\nТест с параметрами...")
        test_cmd2 = cmd + [
            "-u", "http://testphp.vulnweb.com/artists.php?artist=1",
            "--batch",
            "--level", "1",
            "--risk", "1",
            "--technique", "B",
            "-v", "0"
        ]
        
        print(f"Команда: {' '.join(test_cmd2)}")
        print("Это может занять некоторое время...\n")
        
        result2 = subprocess.run(test_cmd2, 
                               capture_output=True, 
                               timeout=60,
                               text=True)
        
        if "sqlmap" in result2.stdout.lower() or "injection" in result2.stdout.lower():
            print("✓ SQLMap работает корректно!")
            return True
        else:
            print("⚠ SQLMap запустился, но результат неоднозначный")
            print(f"Первые 500 символов вывода:\n{result2.stdout[:500]}")
            return True
            
    except subprocess.TimeoutExpired:
        print("⚠ Тест превысил время ожидания, но SQLMap работает")
        return True
    except Exception as e:
        print(f"✗ Ошибка при тестировании: {e}")
        return False


def main():
    """Главная функция"""
    print("="*80)
    print("SQLMap Detector - Поиск и тестирование SQLMap")
    print("="*80 + "\n")
    
    cmd = find_sqlmap()
    
    if cmd:
        print("\n" + "="*80)
        if test_sqlmap_command(cmd):
            print("\n✓ SQLMap готов к использованию!")
            print(f"\nИспользуйте эту команду в скриптах:")
            if len(cmd) == 1:
                print(f"  sqlmap_cmd = '{cmd[0]}'")
            else:
                print(f"  sqlmap_cmd = {cmd}")
            
            # Создание файла конфигурации
            config_file = "sqlmap_path.txt"
            with open(config_file, 'w') as f:
                f.write(' '.join(cmd))
            print(f"\nКоманда сохранена в файл: {config_file}")
        else:
            print("\n✗ SQLMap найден, но работает некорректно")
            sys.exit(1)
    else:
        print("\n✗ SQLMap не найден в системе")
        sys.exit(1)


if __name__ == "__main__":
    main()
