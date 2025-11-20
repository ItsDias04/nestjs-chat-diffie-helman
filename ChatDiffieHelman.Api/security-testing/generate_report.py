#!/usr/bin/env python3
"""
SQLMap Report Generator - Генератор HTML отчетов
"""

import json
import os
from datetime import datetime
from pathlib import Path
import sys


def generate_html_report(report_json_path: str, output_html_path: str):
    """Генерация HTML отчета из JSON"""
    
    # Загрузка JSON отчета
    with open(report_json_path, 'r', encoding='utf-8') as f:
        report = json.load(f)
    
    summary = report['summary']
    results = report['results']
    
    # Подсчет статистики
    vulnerable_count = summary['vulnerable_endpoints']
    safe_count = summary['safe_endpoints']
    total_count = summary['total_endpoints']
    
    vulnerable_results = [r for r in results if r.get('vulnerable', False)]
    
    # HTML шаблон
    html = f"""
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SQLMap Security Report - Chat Diffie-Hellman API</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }}
        
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}
        
        .header p {{
            font-size: 1.1em;
            opacity: 0.9;
        }}
        
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 40px;
            background: #f8f9fa;
        }}
        
        .summary-card {{
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
            transition: transform 0.3s;
        }}
        
        .summary-card:hover {{
            transform: translateY(-5px);
        }}
        
        .summary-card h3 {{
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }}
        
        .summary-card .number {{
            font-size: 3em;
            font-weight: bold;
            margin: 10px 0;
        }}
        
        .summary-card.total .number {{
            color: #667eea;
        }}
        
        .summary-card.vulnerable .number {{
            color: #e74c3c;
        }}
        
        .summary-card.safe .number {{
            color: #27ae60;
        }}
        
        .content {{
            padding: 40px;
        }}
        
        .section {{
            margin-bottom: 40px;
        }}
        
        .section h2 {{
            color: #667eea;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }}
        
        .endpoint-card {{
            background: #f8f9fa;
            border-left: 4px solid #e74c3c;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 5px;
        }}
        
        .endpoint-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }}
        
        .endpoint-name {{
            font-size: 1.3em;
            font-weight: bold;
            color: #333;
        }}
        
        .method {{
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.85em;
            color: white;
        }}
        
        .method.GET {{
            background: #3498db;
        }}
        
        .method.POST {{
            background: #27ae60;
        }}
        
        .method.PUT {{
            background: #f39c12;
        }}
        
        .method.DELETE {{
            background: #e74c3c;
        }}
        
        .endpoint-url {{
            color: #666;
            font-family: 'Courier New', monospace;
            margin-bottom: 10px;
            word-break: break-all;
        }}
        
        .timestamp {{
            color: #999;
            font-size: 0.9em;
        }}
        
        .status {{
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.85em;
        }}
        
        .status.vulnerable {{
            background: #e74c3c;
            color: white;
        }}
        
        .status.safe {{
            background: #27ae60;
            color: white;
        }}
        
        .no-vulnerabilities {{
            text-align: center;
            padding: 40px;
            color: #27ae60;
            font-size: 1.2em;
        }}
        
        .no-vulnerabilities::before {{
            content: "✓";
            display: block;
            font-size: 4em;
            margin-bottom: 20px;
        }}
        
        .footer {{
            background: #2c3e50;
            color: white;
            text-align: center;
            padding: 20px;
            font-size: 0.9em;
        }}
        
        .chart {{
            max-width: 400px;
            margin: 30px auto;
        }}
        
        @media print {{
            body {{
                background: white;
                padding: 0;
            }}
            
            .container {{
                box-shadow: none;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 SQLMap Security Report</h1>
            <p>Chat Diffie-Hellman API Security Testing</p>
            <p style="margin-top: 10px;">Дата тестирования: {summary['test_date']}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>Всего эндпоинтов</h3>
                <div class="number">{total_count}</div>
                <p>Протестировано</p>
            </div>
            
            <div class="summary-card vulnerable">
                <h3>Уязвимые</h3>
                <div class="number">{vulnerable_count}</div>
                <p>Требуют внимания</p>
            </div>
            
            <div class="summary-card safe">
                <h3>Безопасные</h3>
                <div class="number">{safe_count}</div>
                <p>Защищены</p>
            </div>
        </div>
        
        <div class="content">
            <div class="section">
                <h2>📊 Статистика безопасности</h2>
                <p><strong>Базовый URL:</strong> {summary['base_url']}</p>
                <p><strong>Процент безопасности:</strong> {(safe_count / total_count * 100):.1f}%</p>
            </div>
"""
    
    if vulnerable_count > 0:
        html += """
            <div class="section">
                <h2>⚠️ Обнаруженные уязвимости</h2>
                <p style="color: #e74c3c; margin-bottom: 20px;">
                    <strong>Внимание!</strong> Найдены потенциальные SQL-инъекции. 
                    Требуется немедленное исправление.
                </p>
"""
        
        for result in vulnerable_results:
            html += f"""
                <div class="endpoint-card">
                    <div class="endpoint-header">
                        <div class="endpoint-name">{result['endpoint']}</div>
                        <span class="status vulnerable">УЯЗВИМ</span>
                    </div>
                    <div>
                        <span class="method {result['method']}">{result['method']}</span>
                        <span class="endpoint-url">{result['url']}</span>
                    </div>
                    <div class="timestamp">Тестирование: {result['timestamp']}</div>
                    <p style="margin-top: 10px;">
                        <strong>Результаты:</strong> 
                        <a href="file://{result['output_dir']}" target="_blank">
                            Открыть детальный отчет
                        </a>
                    </p>
                </div>
"""
        
        html += """
            </div>
"""
    else:
        html += """
            <div class="section">
                <div class="no-vulnerabilities">
                    <strong>Поздравляем!</strong><br>
                    SQL-инъекции не обнаружены.<br>
                    Все протестированные эндпоинты безопасны.
                </div>
            </div>
"""
    
    html += """
            <div class="section">
                <h2>📋 Все результаты тестирования</h2>
"""
    
    for result in results:
        is_vulnerable = result.get('vulnerable', False)
        status_class = 'vulnerable' if is_vulnerable else 'safe'
        status_text = 'УЯЗВИМ' if is_vulnerable else 'БЕЗОПАСЕН'
        card_style = 'border-left-color: #e74c3c;' if is_vulnerable else 'border-left-color: #27ae60;'
        
        html += f"""
                <div class="endpoint-card" style="{card_style}">
                    <div class="endpoint-header">
                        <div class="endpoint-name">{result['endpoint']}</div>
                        <span class="status {status_class}">{status_text}</span>
                    </div>
                    <div>
                        <span class="method {result['method']}">{result['method']}</span>
                        <span class="endpoint-url">{result['url']}</span>
                    </div>
                    <div class="timestamp">Тестирование: {result['timestamp']}</div>
                </div>
"""
    
    html += f"""
            </div>
        </div>
        
        <div class="footer">
            <p>Отчет сгенерирован автоматически SQLMap Automation Script</p>
            <p>© 2025 Chat Diffie-Hellman API Security Testing</p>
        </div>
    </div>
</body>
</html>
"""
    
    # Сохранение HTML
    with open(output_html_path, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"HTML отчет сохранен: {output_html_path}")


def main():
    """Главная функция"""
    
    if len(sys.argv) < 2:
        print("SQLMap Report Generator")
        print("\nИспользование:")
        print("  python3 generate_report.py <json_report_path> [output_html_path]")
        print("\nПример:")
        print("  python3 generate_report.py sqlmap_results/final_report_20251111_150000.json")
        return
    
    json_path = sys.argv[1]
    
    if not os.path.exists(json_path):
        print(f"Ошибка: Файл {json_path} не найден")
        return
    
    # Определение пути для HTML
    if len(sys.argv) >= 3:
        html_path = sys.argv[2]
    else:
        html_path = json_path.replace('.json', '.html')
    
    try:
        generate_html_report(json_path, html_path)
        print(f"\nОткройте отчет в браузере:")
        print(f"  file://{os.path.abspath(html_path)}")
    except Exception as e:
        print(f"Ошибка при генерации отчета: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
