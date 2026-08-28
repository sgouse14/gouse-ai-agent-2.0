from gouse_ai import GouseAIAgent
from gouse_ai.openai_client import OpenAIClient


def main():
    agent = GouseAIAgent(OpenAIClient())
    print("Gouse AI is ready. Type 'exit' to quit.\n")

    while True:
        message = input("You: ").strip()
        if message.lower() in {"exit", "quit"}:
            break
        try:
            response = agent.run(message)
            print(f"Gouse AI: {response.text}\n")
        except Exception as exc:
            print(f"Error: {exc}\n")


if __name__ == "__main__":
    main()
