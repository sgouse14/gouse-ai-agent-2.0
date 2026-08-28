from dataclasses import dataclass, asdict


@dataclass
class AnalysisFinding:
    category: str
    severity: str
    title: str
    detail: str
    recommendation: str


class ProfessionalArchitectureAnalyzer:
    """Rule-based first-pass checks for BOQ, materials and project completeness."""

    def analyze_materials(self, materials):
        findings = []
        total = 0.0
        missing_quantity = []
        missing_rate = []
        for item in materials:
            if item.quantity is None:
                missing_quantity.append(item.name)
            if item.rate is None:
                missing_rate.append(item.name)
            if item.quantity is not None and item.rate is not None:
                total += item.quantity * item.rate
        if missing_quantity:
            findings.append(AnalysisFinding("BOQ", "high", "Missing quantities", ", ".join(missing_quantity), "Verify quantities against drawings and measurement rules."))
        if missing_rate:
            findings.append(AnalysisFinding("Cost", "medium", "Missing rates", ", ".join(missing_rate), "Add current approved supplier or estimate rates with a clear date and basis."))
        if not materials:
            findings.append(AnalysisFinding("Materials", "high", "No material data", "No material schedule was supplied.", "Upload a material schedule or BOQ before cost analysis."))
        return {"estimated_total": total, "finding_count": len(findings), "findings": [asdict(f) for f in findings]}

    def project_summary(self, project):
        findings = []
        if not project.description.strip():
            findings.append(AnalysisFinding("Scope", "medium", "Project description missing", "The project has no written scope.", "Add building type, goals, area, deliverables and constraints."))
        if not project.location.strip():
            findings.append(AnalysisFinding("Context", "low", "Location missing", "Site location is not recorded.", "Add location and relevant climate, authority and site context."))
        if not project.files:
            findings.append(AnalysisFinding("Documentation", "high", "No project files", "No drawings or supporting documents are attached.", "Attach plans, sections, elevations, BOQ or specifications."))
        return {"project": project.name, "files": len(project.files), "analyses": len(project.analyses), "findings": [asdict(f) for f in findings]}

    def prioritize(self, findings):
        rank = {"high": 0, "medium": 1, "low": 2}
        return sorted(findings, key=lambda item: rank.get(item.get("severity", "low"), 3))
