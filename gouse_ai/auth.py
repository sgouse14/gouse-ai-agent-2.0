import hashlib
import os
import secrets
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path


class AuthStore:
    def __init__(self, path="data/gouse_ai.db"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    def connect(self):
        return sqlite3.connect(self.path)

    def initialize(self):
        with self.connect() as db:
            db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
            """)

    def _hash_password(self, password, salt=None):
        salt = salt or os.urandom(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 200000)
        return salt.hex()+":"+digest.hex()

    def _verify(self, password, stored):
        salt_hex, digest_hex = stored.split(":", 1)
        actual = self._hash_password(password, bytes.fromhex(salt_hex)).split(":",1)[1]
        return secrets.compare_digest(actual, digest_hex)

    def register(self, user_id, email, password):
        with self.connect() as db:
            db.execute("INSERT INTO users VALUES (?,?,?,?)", (user_id, email.lower().strip(), self._hash_password(password), datetime.now(timezone.utc).isoformat()))

    def login(self, email, password):
        with self.connect() as db:
            row=db.execute("SELECT id,password_hash FROM users WHERE email=?",(email.lower().strip(),)).fetchone()
        if not row or not self._verify(password,row[1]): return None
        token=secrets.token_urlsafe(32); expiry=datetime.now(timezone.utc)+timedelta(days=7)
        with self.connect() as db: db.execute("INSERT INTO sessions VALUES (?,?,?)",(hashlib.sha256(token.encode()).hexdigest(),row[0],expiry.isoformat()))
        return token,row[0]
