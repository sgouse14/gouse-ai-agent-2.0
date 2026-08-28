import hashlib, os, secrets, sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROLES={"owner","architect","engineer","viewer"}
class AuthStore:
    def __init__(self,path="data/gouse_ai.db"):
        self.path=Path(path); self.path.parent.mkdir(parents=True,exist_ok=True); self.initialize()
    def connect(self): return sqlite3.connect(self.path)
    def initialize(self):
        with self.connect() as db:
            db.executescript("""CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at TEXT NOT NULL);CREATE TABLE IF NOT EXISTS project_owners(project_id TEXT PRIMARY KEY,user_id TEXT NOT NULL);CREATE TABLE IF NOT EXISTS project_members(project_id TEXT NOT NULL,user_id TEXT NOT NULL,role TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(project_id,user_id));CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);""")
    def _hash_password(self,password,salt=None):
        salt=salt or os.urandom(16); digest=hashlib.pbkdf2_hmac("sha256",password.encode(),salt,200000); return salt.hex()+":"+digest.hex()
    def _verify(self,password,stored):
        salt,digest=stored.split(":",1); actual=self._hash_password(password,bytes.fromhex(salt)).split(":",1)[1]; return secrets.compare_digest(actual,digest)
    def register(self,user_id,email,password):
        with self.connect() as db: db.execute("INSERT INTO users VALUES (?,?,?,?)",(user_id,email.lower().strip(),self._hash_password(password),datetime.now(timezone.utc).isoformat()))
    def login(self,email,password):
        with self.connect() as db: row=db.execute("SELECT id,password_hash FROM users WHERE email=?",(email.lower().strip(),)).fetchone()
        if not row or not self._verify(password,row[1]): return None
        token=secrets.token_urlsafe(32); expiry=datetime.now(timezone.utc)+timedelta(days=7)
        with self.connect() as db: db.execute("INSERT INTO sessions VALUES (?,?,?)",(hashlib.sha256(token.encode()).hexdigest(),row[0],expiry.isoformat()))
        return token,row[0]
    def user_for_token(self,token):
        if not token:return None
        key=hashlib.sha256(token.encode()).hexdigest()
        with self.connect() as db: row=db.execute("SELECT user_id,expires_at FROM sessions WHERE token_hash=?",(key,)).fetchone()
        if not row or datetime.fromisoformat(row[1])<=datetime.now(timezone.utc): return None
        return row[0]
    def set_project_owner(self,project_id,user_id):
        with self.connect() as db:
            db.execute("INSERT OR REPLACE INTO project_owners VALUES (?,?)",(project_id,user_id)); db.execute("INSERT OR REPLACE INTO project_members VALUES (?,?,?,?)",(project_id,user_id,"owner",datetime.now(timezone.utc).isoformat()))
    def role_for_project(self,project_id,user_id):
        with self.connect() as db: row=db.execute("SELECT role FROM project_members WHERE project_id=? AND user_id=?",(project_id,user_id)).fetchone()
        return row[0] if row else ("owner" if self.owns_project(project_id,user_id) else None)
    def owns_project(self,project_id,user_id):
        with self.connect() as db: row=db.execute("SELECT 1 FROM project_owners WHERE project_id=? AND user_id=?",(project_id,user_id)).fetchone()
        return bool(row)
    def user_id_for_email(self,email):
        with self.connect() as db: row=db.execute("SELECT id FROM users WHERE email=?",(email.lower().strip(),)).fetchone()
        return row[0] if row else None
    def add_project_member(self,project_id,email,role):
        if role not in ROLES: raise ValueError("Invalid role")
        user_id=self.user_id_for_email(email)
        if not user_id: raise ValueError("User not found")
        with self.connect() as db: db.execute("INSERT OR REPLACE INTO project_members VALUES (?,?,?,?)",(project_id,user_id,role,datetime.now(timezone.utc).isoformat()))
    def remove_project_member(self,project_id,user_id):
        with self.connect() as db: db.execute("DELETE FROM project_members WHERE project_id=? AND user_id=? AND role!='owner'",(project_id,user_id))
    def project_members(self,project_id):
        with self.connect() as db: rows=db.execute("SELECT u.id,u.email,m.role FROM project_members m JOIN users u ON u.id=m.user_id WHERE m.project_id=? ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END,u.email",(project_id,)).fetchall()
        return [{"id":r[0],"email":r[1],"role":r[2]} for r in rows]
