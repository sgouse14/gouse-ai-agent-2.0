import os
from openai import OpenAI


class OpenAIClient:
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.client = OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))
        self.model = model or os.getenv("GOAI_MODEL", "gpt-5-mini")

    def respond(self, *, instructions: str, message: str) -> str:
        response = self.client.responses.create(
            model=self.model,
            instructions=instructions,
            input=message,
        )
        return response.output_text
