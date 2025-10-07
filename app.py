from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder='.')

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/profile.html')
def profile():
    return send_from_directory('.', 'profile.html')

@app.route('/telegram.js')
def telegram_js():
    return send_from_directory('.', 'telegram.js')

@app.route('/<path:path>')
def static_files(path):
    if os.path.exists(path):
        return send_from_directory('.', path)
    else:
        return "404 Not Found", 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
