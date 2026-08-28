import sqlite3
from datetime import datetime, timezone
from pathlib import Path

class AuditLog:
    def __init__(self, path='data/gouse_ai.db'):
        self.path=Path(path); self.path.parent.mkdir(parents=True,exist_ok=True)
        with sqlite3.connect(self.path) as db:
            db.execute('CREATE TABLE IF NOT EXISTS audit_events (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id TEXT NOT NULL, user_id TEXT, action TEXT NOT NULL, detail TEXT, created_at TEXT NOT NULL)')
            db.execute('CREATE INDEX IF NOT EXISTS idx_audit_project_created ON audit_events(project_id, created_at DESC)')
    def add(self, project_id, user_id, action, detail=''):
        with sqlite3.connect(self.path) as db:
            db.execute('INSERT INTO audit_events(project_id,user_id,action,detail,created_at) VALUES (?,?,?,?,?)',(project_id,user_id,action,detail,datetime.now(timezone.utc).isoformat()))
    def list(self, project_id, limit=100):
        with sqlite3.connect(self.path) as db:
            rows=db.execute('SELECT id,user_id,action,detail,created_at FROM audit_events WHERE project_id=? ORDER BY id DESC LIMIT ?',(project_id,limit)).fetchall()
        return [{'id':r[0],'user_id':r[1],'action':r[2],'detail':r[3],'created_at':r[4]} for r in rows]
