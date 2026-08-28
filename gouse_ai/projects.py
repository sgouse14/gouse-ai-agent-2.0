from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
import json


@dataclass
class Project:
    id: str
    name: str
    project_type: str = "architecture"
    location: str = ""
    description: str = ""
    created_at: str = ""
    files: list[str] = field(default_factory=list)
    analyses: list[dict] = field(default_factory=list)


class ProjectStore:
    def __init__(self, path: str = "data/projects.json"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("[]", encoding="utf-8")

    def _load(self) -> list[Project]:
        return [Project(**item) for item in json.loads(self.path.read_text(encoding="utf-8"))]

    def _save(self, projects: list[Project]) -> None:
        self.path.write_text(json.dumps([asdict(p) for p in projects], indent=2), encoding="utf-8")

    def create(self, name: str, project_type: str = "architecture", location: str = "", description: str = "") -> Project:
        project = Project(id=uuid4().hex, name=name, project_type=project_type, location=location, description=description, created_at=datetime.now(timezone.utc).isoformat())
        projects = self._load()
        projects.append(project)
        self._save(projects)
        return project

    def list(self) -> list[Project]:
        return self._load()

    def get(self, project_id: str) -> Project | None:
        return next((p for p in self._load() if p.id == project_id), None)

    def add_file(self, project_id: str, filename: str) -> Project:
        projects = self._load()
        project = next((p for p in projects if p.id == project_id), None)
        if project is None:
            raise KeyError(project_id)
        project.files.append(filename)
        self._save(projects)
        return project

    def add_analysis(self, project_id: str, title: str, analysis: str) -> Project:
        projects = self._load()
        project = next((p for p in projects if p.id == project_id), None)
        if project is None:
            raise KeyError(project_id)
        project.analyses.append({"title": title, "analysis": analysis, "created_at": datetime.now(timezone.utc).isoformat()})
        self._save(projects)
        return project
