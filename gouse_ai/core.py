from dataclasses import dataclass, field
from typing import Protocol

from .prompts import SYSTEM_PROMPT


class LLMClient(Protocol):
    def respond(self, *, instructions: str, message: str) -> str: ...


@dataclass
class AgentResponse:
    text: str
    metadata: dict[str, str] = field(default_factory=dict)


class GouseAIAgent:
    """Clean, provider-independent core for Gouse AI."""

    def __init__(self, client: LLMClient, instructions: str = SYSTEM_PROMPT):
        self.client = client
        self.instructions = instructions
        self.history: list[tuple[str, str]] = []

    def run(self, message: str) -> AgentResponse:
        message = message.strip()
        if not message:
            raise ValueError("Message cannot be empty.")

        context = "\n".join(
            f"{role}: {text}" for role, text in self.history[-10:]
        )
        prompt = f"Conversation:\n{context}\n\nUser: {message}" if context else message
        text = self.client.respond(
            instructions=self.instructions,
            message=prompt,
        ).strip()

        self.history.extend([("User", message), ("Gouse AI", text)])
        return AgentResponse(text=text)

    def reset(self) -> None:
        self.history.clear()
