"""Frontend Flask del MiniCompilador."""
from flask import Flask, render_template, request, jsonify
import requests, os

app = Flask(__name__)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8002")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/compile", methods=["POST"])
def compile_proxy():
    data = request.get_json()
    try:
        resp = requests.post(f"{BACKEND_URL}/api/compile", json=data, timeout=10)
        return jsonify(resp.json()), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
