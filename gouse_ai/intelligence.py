from dataclasses import asdict
from pathlib import Path

from .documents import extract_text


class ProjectIntelligenceEngine:
    """Builds a single architecture intelligence brief from project data."""

    def __init__(self, report_agent):
        self.report_agent = report_agent

    def build_context(self, project, upload_dir: str | Path) -> str:
        sections = [
            f"Project name: {project.name}",
            f"Project type: {project.project_type}",
            f"Location: {project.location or 'Not provided'}",
            f"Description: {project.description or 'Not provided'}",
        ]
        root = Path(upload_dir)
        for filename in project.files:
            path = root / Path(filename).name
            if not path.exists():
                sections.append(f"File unavailable: {filename}")
                continue
            try:
                summary = extract_text(path)
                sections.append(f"\nFILE: {summary.filename}\n{summary.extracted_text[:12000]}")
            except Exception as exc:
                sections.append(f"File could not be extracted: {filename} ({exc})")
        for item in project.analyses:
            sections.append(f"\nPRIOR ANALYSIS: {item.get('title', 'Untitled')}\n{item.get('analysis', '')}")
        return "\n".join(sections)

    def analyze(self, project, upload_dir: str | Path, focus: str = "") -> dict:
        context = self.build_context(project, upload_dir)
        report = self.report_agent.analyze(
            context,
            f"Project {project.name}",
            focus or "Create a complete integrated architecture project intelligence report.",
        )
        return {
            "project": asdict(project),
            "title": report.title,
            "analysis": report.analysis,
            "sources": {"files": len(project.files), "prior_analyses": len(project.analyses)},
        }
