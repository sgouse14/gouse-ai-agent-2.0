import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path


class Database:
    """SQLite persistence for projects and project-scoped AI memory."""

    def __init__(self, path: str = "data/gouse_ai.db"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.initialize()

    @contextmanager
    def connect(self):
        connection = sqlite3.connect(self.path)
        connection.row_factory = sqlite3.Row
        try:
            yield connection
            connection.commit()
        finally:
            connection.close()

    def initialize(self):
        with self.connect() as db:
            db.executescript("""
            CREATE TABLE IF NOT EXISTS project_memory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_project_memory_project
            ON project_memory(project_id, id);
            """)

    def add_memory(self, project_id: str, role: str, content: str):
        with self.connect() as db:
            db.execute(
                "INSERT INTO project_memory(project_id, role, content, created_at) VALUES (?, ?, ?, ?)",
                (project_id, role, content, datetime.now(timezone.utc).isoformat()),
            )

    def get_memory(self, project_id: str, limit: int = 50):
        with self.connect() as db:
            rows = db.execute(
                "SELECT role, content, created_at FROM project_memory WHERE project_id=? ORDER BY id DESC LIMIT ?",
                (project_id, limit),
            ).fetchall()
        return [dict(row) for row in reversed(rows)]

    def clear_memory(self, project_id: str):
        with self.connect() as db:
            db.execute("DELETE FROM project_memory WHERE project_id=?", (project_id,))
