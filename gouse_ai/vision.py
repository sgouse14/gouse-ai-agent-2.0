from dataclasses import dataclass
from pathlib import Path


@dataclass
class VisionRequest:
    image_path: str
    focus: str = "General architectural analysis"


class ArchitectureVisionAnalyzer:
    """Prepares architectural image analysis requests."""

    def build_analysis_prompt(self, request: VisionRequest) -> str:
        name = Path(request.image_path).name
        return f"""Analyze the architectural image: {name}.
Focus: {request.focus}

Report only visible or clearly inferable information under:
1. Drawing/image type
2. Spaces and architectural elements
3. Materials and finishes
4. Dimensions or labels visible in the image
5. Design observations
6. Coordination concerns
7. Information requiring verification
"""


class RenderPromptBuilder:
    """Creates explicit conceptual architectural rendering briefs."""

    def build(self, description: str, style: str = "photorealistic") -> str:
        return (
            f"Architectural conceptual render. Style: {style}. "
            f"Project brief: {description}. "
            "Show coherent proportions, realistic materials, natural lighting, "
            "and clearly distinguish conceptual visualization from construction documentation."
        )
