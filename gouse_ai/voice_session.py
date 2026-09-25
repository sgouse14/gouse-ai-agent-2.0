"""Conversation session state for the Gouse AI voice layer."""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Literal

AgentId = Literal["gouse", "ghousia"]
Language = Literal["English", "Hindi", "Kannada"]


@dataclass
class VoiceSession:
    session_id: str
    agent_id: AgentId = "gouse"
    language: Language = "English"
    status: str = "CONNECTED"
    transcript: list[dict[str, str]] = field(default_factory=list)
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: datetime | None = None

    def add_turn(self, speaker: str, text: str) -> None:
        self.transcript.append({"speaker": speaker, "text": text})

    def set_language(self, language: Language) -> None:
        self.language = language

    def end(self) -> None:
        self.status = "ENDED"
        self.ended_at = datetime.now(timezone.utc)

    def summary_context(self) -> dict:
        return {
            "session_id": self.session_id,
            "agent_id": self.agent_id,
            "language": self.language,
            "status": self.status,
            "turn_count": len(self.transcript),
            "started_at": self.started_at.isoformat(),
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }
