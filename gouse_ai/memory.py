from pathlib import Path
import json


class FileMemory:
    def __init__(self, path: str = "data/memory.json"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self.path.write_text("[]", encoding="utf-8")

    def add(self, role: str, text: str) -> None:
        items = self.load()
        items.append({"role": role, "text": text})
        self.path.write_text(json.dumps(items, indent=2), encoding="utf-8")

    def load(self) -> list[dict[str, str]]:
        return json.loads(self.path.read_text(encoding="utf-8"))

    def clear(self) -> None:
        self.path.write_text("[]", encoding="utf-8")
