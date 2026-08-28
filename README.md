# Gouse AI Agent 2.0

Gouse AI is a clean, extensible AI business assistant with a Python agent core, persistent local memory, REST API, and browser chat interface.

## Features

- AI business assistant core
- Conversation history
- Persistent JSON memory
- OpenAI provider adapter
- FastAPI backend
- Browser chat interface
- Health and memory API endpoints
- Automated core tests

## Project structure

```text
gouse-ai-agent-2.0/
├── gouse_ai/
│   ├── core.py
│   ├── memory.py
│   ├── openai_client.py
│   └── prompts.py
├── static/
├── tests/
├── app.py
├── main.py
└── requirements.txt
```

## Setup

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Add your `OPENAI_API_KEY` to `.env`.

## Run the web application

```bash
uvicorn app:app --reload
```

Open `http://127.0.0.1:8000` in your browser.

## Run the command-line agent

```bash
python main.py
```

## Test

```bash
pytest
```

## Next development

Future extensions can add authentication, multi-user memory, business tools, document processing, scheduling, database storage, and deployment.
