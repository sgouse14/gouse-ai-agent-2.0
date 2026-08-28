from dataclasses import dataclass, asdict
from typing import Iterable


@dataclass
class Material:
    name: str
    category: str
    unit: str = ""
    quantity: float | None = None
    rate: float | None = None
    notes: str = ""

    @property
    def estimated_cost(self) -> float | None:
        if self.quantity is None or self.rate is None:
            return None
        return self.quantity * self.rate


class ArchitectureAnalyzer:
    """Structured analysis for architectural materials and project inputs."""

    def analyze_materials(self, materials: Iterable[Material]) -> dict:
        items = list(materials)
        total = sum(item.estimated_cost or 0 for item in items)
        missing = [item.name for item in items if item.quantity is None or item.rate is None]
        return {
            "material_count": len(items),
            "estimated_total": total,
            "missing_cost_data": missing,
            "materials": [
                {**asdict(item), "estimated_cost": item.estimated_cost}
                for item in items
            ],
        }

    def compare(self, options: Iterable[Material]) -> list[dict]:
        return sorted(
            [
                {**asdict(item), "estimated_cost": item.estimated_cost}
                for item in options
            ],
            key=lambda item: float("inf") if item["estimated_cost"] is None else item["estimated_cost"],
        )

    def checklist(self, project_type: str) -> list[str]:
        return [
            f"Confirm project brief and scope for {project_type}",
            "Verify drawings, dimensions, levels, and site conditions",
            "Check material specifications and approved alternatives",
            "Compare quantity, rate, lead time, maintenance, and lifecycle impact",
            "Flag coordination items requiring structural, MEP, code, or specialist review",
        ]
