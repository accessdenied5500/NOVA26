from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import hashlib
import json
import secrets

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
STORAGE_FILE = BASE_DIR / "database" / "users_store.json"


def init_db():
    STORAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not STORAGE_FILE.exists():
        STORAGE_FILE.write_text(json.dumps({"users": [], "user_data": {}}, indent=2))


def load_store():
    try:
        return json.loads(STORAGE_FILE.read_text())
    except Exception:
        return {"users": [], "user_data": {}}


def save_store(data):
    STORAGE_FILE.write_text(json.dumps(data, indent=2))


def get_user_from_token(token: str):
    if not token:
        return None
    store = load_store()
    for user in store.get("users", []):
        if user.get("token") == token:
            return user
    return None


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


init_db()


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "Student").strip()
    username = (data.get("username") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not name or not username or not password:
        return jsonify({"error": "Name, username, and password are required"}), 400

    store = load_store()
    if any(user.get("username") == username for user in store.get("users", [])):
        return jsonify({"error": "Username already taken"}), 400

    token = secrets.token_hex(16)
    password_hash = hash_password(password)
    user_id = len(store.get("users", [])) + 1
    user = {
        "id": user_id,
        "name": name,
        "username": username,
        "password_hash": password_hash,
        "token": token,
    }
    store.setdefault("users", []).append(user)
    store.setdefault("user_data", {})[str(user_id)] = {"notes": [], "schedule": [], "tasks": []}
    save_store(store)

    return jsonify({
        "user": {
            "id": user_id,
            "name": name,
            "username": username,
            "token": token,
        },
        "data": {"notes": [], "schedule": [], "tasks": []},
    })


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    store = load_store()
    user = next((item for item in store.get("users", []) if item.get("username") == username), None)
    if not user or user.get("password_hash") != hash_password(password):
        return jsonify({"error": "Invalid username or password"}), 401

    data_payload = store.get("user_data", {}).get(str(user["id"]), {"notes": [], "schedule": [], "tasks": []})

    return jsonify({
        "user": {
            "id": user["id"],
            "name": user["name"],
            "username": user["username"],
            "token": user["token"],
        },
        "data": data_payload,
    })


@app.route("/api/profile", methods=["GET", "POST"])
def profile():
    token = request.headers.get("Authorization", "").replace("Bearer ", "", 1).strip()
    if not token:
        return jsonify({"error": "Authentication required"}), 401

    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Invalid session"}), 401

    store = load_store()
    if request.method == "GET":
        data_payload = store.get("user_data", {}).get(str(user["id"]), {"notes": [], "schedule": [], "tasks": []})
        return jsonify({
            "user": {
                "id": user["id"],
                "name": user["name"],
                "username": user["username"],
            },
            "data": data_payload,
        })

    payload = request.get_json(silent=True) or {}
    data_payload = payload.get("data") or {"notes": [], "schedule": [], "tasks": []}
    store.setdefault("user_data", {})[str(user["id"])] = data_payload
    save_store(store)
    return jsonify({"success": True, "data": data_payload})


@app.route("/api/logout", methods=["POST"])
def logout():
    token = request.headers.get("Authorization", "").replace("Bearer ", "", 1).strip()
    if token:
        store = load_store()
        for user in store.get("users", []):
            if user.get("token") == token:
                user["token"] = None
                break
        save_store(store)
    return jsonify({"success": True})


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(FRONTEND_DIR, path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
