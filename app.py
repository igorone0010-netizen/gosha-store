from flask import Flask, render_template, request, jsonify
import os
from datetime import datetime

app = Flask(__name__)

# Данные магазина с разделами
categories = [
    {
        "id": 1,
        "name": "🎮 PlayStation Личный",
        "type": "playstation_personal"
    },
    {
        "id": 2, 
        "name": "🎮 PlayStation Общий (Скидки до 80%)",
        "type": "playstation_shared"
    },
    {
        "id": 3,
        "name": "💳 Пополнение кошелька",
        "type": "wallet_topup"
    }
]

products = [
    # PlayStation Личный
    {"id": 1, "name": "The Last of Us II", "price": 5000, "image": "🎮", "category": "playstation_personal"},
    {"id": 2, "name": "God of War", "price": 4500, "image": "⚔️", "category": "playstation_personal"},
    
    # PlayStation Общий  
    {"id": 3, "name": "Spider-Man 2", "price": 2500, "image": "🕷️", "category": "playstation_shared"},
    
    # Steam
    {"id": 4, "name": "Steam 1000 руб", "price": 1080, "image": "🎯", "category": "steam"},
    
    # FIFA
    {"id": 5, "name": "FIFA 1000 Points", "price": 1000, "image": "⚽", "category": "fifa"},
    
    # GamePass
    {"id": 6, "name": "GamePass 1 мес", "price": 800, "image": "🎮", "category": "gamepass"},
    
    # Valorant
    {"id": 7, "name": "Valorant 1000 VP", "price": 950, "image": "🔫", "category": "valorant"},
    
    # Nintendo
    {"id": 8, "name": "Nintendo 1000 руб", "price": 1050, "image": "👾", "category": "nintendo"}
]

orders = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/categories')
def get_categories():
    return jsonify(categories)

@app.route('/api/products')
def get_products():
    category = request.args.get('category')
    if category:
        filtered_products = [p for p in products if p['category'] == category]
        return jsonify(filtered_products)
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

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
