from gouse_ai.core import GouseAIAgent


class FakeClient:
    def respond(self, *, instructions: str, message: str) -> str:
        return f"Received: {message}"


def test_agent_response():
    agent = GouseAIAgent(FakeClient())
    response = agent.run("Hello")
    assert "Hello" in response.text
    assert len(agent.history) == 2


def test_agent_reset():
    agent = GouseAIAgent(FakeClient())
    agent.run("Hello")
    agent.reset()
    assert agent.history == []
