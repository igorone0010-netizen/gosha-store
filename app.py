from flask import Flask, send_file, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app)  # Разрешаем CORS для всех доменов

@app.route('/')
def home():
    return send_file('templates/index.html')

# Маршрут для статических файлов (CSS, JS)
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/api/products')
def get_products():
    try:
        # Пытаемся загрузить данные из файла
        with open('products_data.json', 'r', encoding='utf-8') as f:
            products_data = json.load(f)
        return jsonify(products_data)
    except FileNotFoundError:
        # Если файла нет, создаем пустую структуру
        default_data = {"playstation_personal": []}
        with open('products_data.json', 'w', encoding='utf-8') as f:
            json.dump(default_data, f, ensure_ascii=False, indent=2)
        return jsonify(default_data)
    except Exception as e:
        print(f"Ошибка загрузки товаров: {e}")
        return jsonify({"playstation_personal": []})

@app.route('/api/admin/save-products', methods=['POST'])
def save_products():
    try:
        products_data = request.json
        
        # Сохраняем в файл
        with open('products_data.json', 'w', encoding='utf-8') as f:
            json.dump(products_data, f, ensure_ascii=False, indent=2)
        
        return jsonify({"status": "success", "message": "Товары сохранены на сервер"})
    except Exception as e:
        print(f"Ошибка сохранения товаров: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

# Маршрут для проверки работы сервера
@app.route('/api/health')
def health_check():
    return jsonify({"status": "ok", "message": "Server is running"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 12000))  # Используем порт 12000 по умолчанию
    app.run(host='0.0.0.0', port=port, debug=True)
