
from pathlib import Path
import json

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(
    title="Local AI Server",
    description="API para interagir com uma IA executada localmente.",
    version="1.2.0",
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "llama3.2"

app.mount(
    "/static",
    StaticFiles(directory=FRONTEND_DIR),
    name="static",
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    model: str


@app.get("/", include_in_schema=False)
async def home():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/api", include_in_schema=False)
async def api_home():
    return {
        "project": "Local AI Server",
        "status": "online",
        "model": MODEL,
    }


@app.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            result = await client.get(
                "http://127.0.0.1:11434/api/tags"
            )
            result.raise_for_status()
        return {"status": "ok", "ollama": "online"}
    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="O Ollama não está disponível.",
        )


async def generate_stream(message: str):
    try:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(180.0, connect=10.0)
        ) as client:
            async with client.stream(
                "POST",
                OLLAMA_URL,
                json={
                    "model": MODEL,
                    "prompt": message,
                    "stream": True,
                },
            ) as result:
                result.raise_for_status()

                async for line in result.aiter_lines():
                    if not line:
                        continue

                    data = json.loads(line)
                    token = data.get("response", "")

                    if token:
                        yield (
                            json.dumps({"token": token}, ensure_ascii=False)
                            + "\n"
                        )

                    if data.get("done", False):
                        yield json.dumps({"done": True}) + "\n"
                        return

    except (httpx.HTTPError, json.JSONDecodeError):
        yield json.dumps(
            {"error": "Não foi possível concluir a resposta da IA."},
            ensure_ascii=False,
        ) + "\n"


@app.post("/chat")
@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="A mensagem não pode estar vazia.",
        )

    return StreamingResponse(
        generate_stream(request.message),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache"},
    )
