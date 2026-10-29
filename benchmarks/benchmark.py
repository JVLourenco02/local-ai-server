import json
import time
from datetime import datetime
from pathlib import Path

import httpx

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "llama3.2"
RESULTS_FILE = Path(__file__).parent / "results.jsonl"

PROMPT = "Explique em poucas palavras o que e uma inteligencia artificial local."


def main():
    print("=== Local AI Server - Benchmark ===")
    print(f"Modelo: {MODEL}")
    print(f"Inicio do teste: {datetime.now().isoformat(timespec='seconds')}")
    print("Enviando prompt ao Ollama...\n")

    payload = {
        "model": MODEL,
        "prompt": PROMPT,
        "stream": False,
        "options": {
            "num_predict": 80,
            "temperature": 0,
        },
    }

    start_time = time.perf_counter()

    try:
        response = httpx.post(
            OLLAMA_URL,
            json=payload,
            timeout=300.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        print(f"Erro ao consultar o Ollama: {error}")
        return

    elapsed_seconds = time.perf_counter() - start_time
    result = response.json()

    response_text = result.get("response", "")
    eval_count = result.get("eval_count", 0)
    eval_duration = result.get("eval_duration", 0)
    prompt_eval_duration = result.get("prompt_eval_duration", 0)
    load_duration = result.get("load_duration", 0)
    total_duration = result.get("total_duration", 0)

    tokens_per_second = (
        eval_count / (eval_duration / 1_000_000_000)
        if eval_duration > 0
        else 0
    )

    metrics = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "model": MODEL,
        "prompt": PROMPT,
        "response_seconds": round(elapsed_seconds, 3),
        "ollama_total_seconds": round(total_duration / 1_000_000_000, 3),
        "load_seconds": round(load_duration / 1_000_000_000, 3),
        "prompt_eval_seconds": round(prompt_eval_duration / 1_000_000_000, 3),
        "prompt_tokens": result.get("prompt_eval_count", 0),
        "generated_tokens": eval_count,
        "generation_tokens_per_second": round(tokens_per_second, 2),
        "response": response_text,
    }

    print("Resposta do modelo:")
    print(response_text)
    print("\n=== Metricas ===")
    print(json.dumps(metrics, indent=2, ensure_ascii=False))

    with RESULTS_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(metrics, ensure_ascii=False) + "\n")

    print(f"\nResultado salvo em: {RESULTS_FILE}")

if __name__ == "__main__":
    main()
