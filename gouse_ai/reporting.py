from dataclasses import dataclass

from .architecture_prompts import ARCHITECTURE_INSTRUCTIONS


@dataclass
class ArchitectureReport:
    title: str
    analysis: str


class ArchitectureReportAgent:
    """Turns extracted project information into a structured AI report."""

    def __init__(self, agent):
        self.agent = agent

    def analyze(self, document_text: str, filename: str = "project document", question: str = "") -> ArchitectureReport:
        prompt = f"""{ARCHITECTURE_INSTRUCTIONS}

Document: {filename}
User focus: {question or 'Provide a general architecture analysis.'}

Extracted project information:
---
{document_text[:30000]}
---

Create a practical architecture report using these headings:
1. Project understanding
2. Key design and document observations
3. Materials and BOQ observations
4. Missing information and assumptions
5. Risks and coordination issues
6. Recommended next actions

Do not invent measurements, quantities, approvals, or code compliance results that are not supported by the supplied information.
"""
        response = self.agent.run(prompt)
        return ArchitectureReport(title=f"Architecture Analysis: {filename}", analysis=response.text)
