#!/usr/bin/env python3
"""
Simple HTTP server for PlayStation Store Telegram Mini App
"""

import http.server
import socketserver
import json
import os
import sys
from urllib.parse import urlparse, parse_qs
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PSStoreHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def do_GET(self):
        """Обработка GET запросов"""
        parsed_path = urlparse(self.path)
        
        # Главная страница
        if parsed_path.path == '/' or parsed_path.path == '/index.html':
            self.serve_file('index.html', 'text/html')
            return
        
        # API для получения продуктов
        if parsed_path.path == '/api/products':
            self.serve_products()
            return
        
        # Webhook для заказов
        if parsed_path.path.startswith('/webhook/'):
            self.handle_webhook_get(parsed_path.path)
            return
        
        # Статические файлы
        super().do_GET()

    def do_POST(self):
        """Обработка POST запросов"""
        parsed_path = urlparse(self.path)
        
        # Webhook для заказов
        if parsed_path.path == '/webhook/order':
            self.handle_order_webhook()
            return
        
        # Webhook для поддержки
        if parsed_path.path == '/webhook/support':
            self.handle_support_webhook()
            return
        
        # По умолчанию возвращаем 404
        self.send_error(404, "Not Found")

    def serve_file(self, filename, content_type):
        """Отправка файла клиенту"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                content = f.read()
            
            self.send_response(200)
            self.send_header('Content-type', content_type)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(content.encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404, f"File {filename} not found")

    def serve_products(self):
        """Отправка данных о продуктах"""
        try:
            with open('products_data.json', 'r', encoding='utf-8') as f:
                products_data = json.load(f)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(products_data, ensure_ascii=False).encode('utf-8'))
        except FileNotFoundError:
            self.send_error(404, "Products data not found")
        except json.JSONDecodeError:
            self.send_error(500, "Invalid products data")

    def handle_order_webhook(self):
        """Обработка webhook для заказов"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            order_data = json.loads(post_data.decode('utf-8'))
            
            logger.info("Получен новый заказ:")
            logger.info(f"Пользователь: {order_data.get('user', {}).get('first_name', 'Неизвестно')}")
            logger.info(f"ID заказа: {order_data.get('order', {}).get('id', 'Неизвестно')}")
            logger.info(f"Сумма: {order_data.get('order', {}).get('total', 0)} ₽")
            logger.info(f"Товары: {len(order_data.get('order', {}).get('items', []))}")
            
            # Здесь можно добавить логику отправки уведомления администратору
            # Например, через Telegram Bot API
            
            # Сохраняем заказ в файл для демонстрации
            self.save_order_to_file(order_data)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {"status": "success", "message": "Order received"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            logger.error(f"Ошибка обработки заказа: {e}")
            self.send_error(500, "Internal Server Error")

    def handle_support_webhook(self):
        """Обработка webhook для поддержки"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            support_data = json.loads(post_data.decode('utf-8'))
            
            logger.info("Получен тикет поддержки:")
            logger.info(f"Пользователь: {support_data.get('user', {}).get('first_name', 'Неизвестно')}")
            logger.info(f"ID тикета: {support_data.get('ticket', {}).get('id', 'Неизвестно')}")
            logger.info(f"Тема: {support_data.get('ticket', {}).get('subject', 'Неизвестно')}")
            logger.info(f"Сообщение: {support_data.get('ticket', {}).get('message', 'Пусто')}")
            
            # Сохраняем тикет в файл для демонстрации
            self.save_ticket_to_file(support_data)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {"status": "success", "message": "Support ticket received"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            logger.error(f"Ошибка обработки тикета: {e}")
            self.send_error(500, "Internal Server Error")

    def handle_webhook_get(self, path):
        """Обработка GET запросов к webhook"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        response = {"status": "ok", "message": "Webhook endpoint is active"}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def save_order_to_file(self, order_data):
        """Сохранение заказа в файл"""
        try:
            orders_file = 'orders.json'
            orders = []
            
            # Загружаем существующие заказы
            if os.path.exists(orders_file):
                with open(orders_file, 'r', encoding='utf-8') as f:
                    orders = json.load(f)
            
            # Добавляем новый заказ
            orders.append(order_data)
            
            # Сохраняем обратно
            with open(orders_file, 'w', encoding='utf-8') as f:
                json.dump(orders, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logger.error(f"Ошибка сохранения заказа: {e}")

    def save_ticket_to_file(self, ticket_data):
        """Сохранение тикета в файл"""
        try:
            tickets_file = 'support_tickets.json'
            tickets = []
            
            # Загружаем существующие тикеты
            if os.path.exists(tickets_file):
                with open(tickets_file, 'r', encoding='utf-8') as f:
                    tickets = json.load(f)
            
            # Добавляем новый тикет
            tickets.append(ticket_data)
            
            # Сохраняем обратно
            with open(tickets_file, 'w', encoding='utf-8') as f:
                json.dump(tickets, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logger.error(f"Ошибка сохранения тикета: {e}")

    def end_headers(self):
        """Добавляем CORS заголовки"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def run_server(port=12000):
    """Запуск сервера"""
    try:
        with socketserver.TCPServer(("0.0.0.0", port), PSStoreHandler) as httpd:
            logger.info(f"PlayStation Store сервер запущен на порту {port}")
            logger.info(f"Откройте http://localhost:{port} в браузере")
            logger.info("Нажмите Ctrl+C для остановки сервера")
            httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Сервер остановлен")
    except Exception as e:
        logger.error(f"Ошибка запуска сервера: {e}")

if __name__ == "__main__":
    port = 12000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            logger.error("Неверный номер порта")
            sys.exit(1)
    
    run_server(port)