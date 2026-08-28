from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from gouse_ai import GouseAIAgent
from gouse_ai.openai_client import OpenAIClient
from gouse_ai.memory import FileMemory

load_dotenv()
app = FastAPI(title="Gouse AI Agent", version="2.0.0")
agent = GouseAIAgent(OpenAIClient())
memory = FileMemory()


class ChatRequest(BaseModel):
    message: str


@app.get("/api/health")
def health():
    return {"status": "ok", "agent": "Gouse AI"}


@app.post("/api/chat")
def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    memory.add("user", request.message)
    response = agent.run(request.message)
    memory.add("assistant", response.text)
    return {"response": response.text}


@app.get("/api/memory")
def get_memory():
    return {"items": memory.load()}


@app.delete("/api/memory")
def clear_memory():
    agent.reset()
    memory.clear()
    return {"status": "cleared"}


app.mount("/", StaticFiles(directory="static", html=True), name="static")
