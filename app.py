from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

app = Flask(__name__)

# Данные магазина
products = [
    {
        "id": 1,
        "name": "The Last of Us Part II", 
        "price": 5000,
        "description": "Эпическая игра про выживание в постапокалиптическом мире",
        "image": "🎮",
        "category": "PlayStation"
    }
]

orders = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/products')
def get_products():
    return jsonify(products)

@app.route('/api/order', methods=['POST'])
def create_order():
    order_data = request.json
    
    new_order = {
        "id": len(orders) + 1,
        "products": order_data['products'],
        "total": order_data['total'],
        "customer_name": order_data.get('customer_name', 'Покупатель'),
        "phone": order_data.get('phone', 'Не указан'),
        "created_at": datetime.now().strftime("%d.%m.%Y %H:%M")
    }
    
    orders.append(new_order)
    
    return jsonify({
        "success": True, 
        "order_id": new_order['id'],
        "message": f"Заказ #{new_order['id']} оформлен!"
    })

# ВАЖНО: host='0.0.0.0' чтобы сервер был доступен извне
if __name__ == '__main__':
    print("✅ Магазин работает на http://localhost:5000")
    print("🌐 Сервер доступен из интернета")
    app.run(host='0.0.0.0', port=5000, debug=True)