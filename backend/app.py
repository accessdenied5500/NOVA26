from flask import Flask, jsonify, request, send_from_directory
from pathlib import Path
import hashlib
import json
import secrets
import sqlite3

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DB_PATH = BASE_DIR / "database" / "nova26.sqlite3"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT,
            class_name TEXT,
            board TEXT,
            subject TEXT,
            email TEXT,
            password_hash TEXT NOT NULL,
            token TEXT UNIQUE
        )
        """
    )
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS user_data (
            user_id INTEGER PRIMARY KEY,
            data_json TEXT NOT NULL DEFAULT '{}'
        )
        """
    )

    columns = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
    for column_name, definition in {
        "username": "TEXT",
        "class_name": "TEXT",
        "board": "TEXT",
        "subject": "TEXT",
        "email": "TEXT",
    }.items():
        if column_name not in columns:
            conn.execute(f"ALTER TABLE users ADD COLUMN {column_name} {definition}")

    conn.execute("UPDATE users SET username = email WHERE username IS NULL AND email IS NOT NULL")
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)")
    conn.commit()
    conn.close()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def get_user_from_token(token: str):
    if not token:
        return None
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE token = ?", (token,)).fetchone()
    conn.close()
    return user


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

    conn = get_db()
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "Username already taken"}), 400

    token = secrets.token_hex(16)
    password_hash = hash_password(password)
    cursor = conn.execute(
        "INSERT INTO users (name, username, password_hash, token) VALUES (?, ?, ?, ?)",
        (name, username, password_hash, token),
    )
    user_id = cursor.lastrowid
    conn.execute("INSERT INTO user_data (user_id, data_json) VALUES (?, ?)", (user_id, json.dumps({"notes": [], "schedule": [], "tasks": []})))
    conn.commit()
    conn.close()

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

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    if not user or user["password_hash"] != hash_password(password):
        conn.close()
        return jsonify({"error": "Invalid username or password"}), 401

    data_row = conn.execute("SELECT data_json FROM user_data WHERE user_id = ?", (user["id"],)).fetchone()
    conn.close()

    data_payload = json.loads(data_row["data_json"]) if data_row else {"notes": [], "schedule": [], "tasks": []}

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

    conn = get_db()
    if request.method == "GET":
        data_row = conn.execute("SELECT data_json FROM user_data WHERE user_id = ?", (user["id"],)).fetchone()
        conn.close()
        data_payload = json.loads(data_row["data_json"]) if data_row else {"notes": [], "schedule": [], "tasks": []}
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
    conn.execute("UPDATE user_data SET data_json = ? WHERE user_id = ?", (json.dumps(data_payload), user["id"]))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "data": data_payload})


@app.route("/api/logout", methods=["POST"])
def logout():
    token = request.headers.get("Authorization", "").replace("Bearer ", "", 1).strip()
    if token:
        conn = get_db()
        conn.execute("UPDATE users SET token = NULL WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return jsonify({"success": True})


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(FRONTEND_DIR, path)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
