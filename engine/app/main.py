"""SYNTH's local Python research engine.

The web application owns its SQLite packet ledger. This service owns local
research execution and reports exactly which backend performed a run. V1 uses
Ollama because it is already installed locally; a Transformers adapter is
reported as unavailable until its runtime and a model are explicitly installed.
"""

from __future__ import annotations

import importlib.util
import os
import time
from typing import Any, Literal

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

APP_VERSION = "0.1.0"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
DEFAULT_TRANSFORMERS_MODEL = os.getenv("SYNTH_TRANSFORMERS_MODEL", "HuggingFaceTB/SmolLM2-135M-Instruct")
_transformer_cache: dict[str, Any] = {}

app = FastAPI(
    title="SYNTH Local Research Engine",
    version=APP_VERSION,
    description="Local model execution and preflight for SYNTH experiments.",
)


class RunRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=100_000)
    model: str = "qwen3:4b"
    provider: Literal["ollama", "transformers"] = "ollama"
    system_prompt: str | None = None
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_new_tokens: int = Field(default=160, ge=1, le=512)


class ValidationRequest(BaseModel):
    records: list[dict[str, Any]] = Field(default_factory=list)


def transformers_status() -> dict[str, bool]:
    return {
        "transformers_installed": importlib.util.find_spec("transformers") is not None,
        "torch_installed": importlib.util.find_spec("torch") is not None,
    }


def load_transformer(model_id: str) -> tuple[Any, Any]:
    """Load a small explicitly requested open model once per engine process."""
    if model_id in _transformer_cache:
        cached = _transformer_cache[model_id]
        return cached["tokenizer"], cached["model"]
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
    except ImportError as error:
        raise RuntimeError("Transformers runtime is not installed.") from error

    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=False)
    model = AutoModelForCausalLM.from_pretrained(model_id, trust_remote_code=False, torch_dtype=torch.float32)
    model.eval()
    _transformer_cache[model_id] = {"tokenizer": tokenizer, "model": model}
    return tokenizer, model


async def ollama_models() -> list[str]:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            return [entry["name"] for entry in response.json().get("models", [])]
    except httpx.HTTPError:
        return []


@app.get("/health")
async def health() -> dict[str, Any]:
    models = await ollama_models()
    return {
        "service": "synth-local-engine",
        "version": APP_VERSION,
        "ollama": {"running": bool(models), "base_url": OLLAMA_BASE_URL, "models": models},
        "transformers": transformers_status(),
        "transformers_default_model": DEFAULT_TRANSFORMERS_MODEL,
        "loaded_transformer_models": list(_transformer_cache.keys()),
        "note": "Transformers runs require an explicitly installed runtime and local or authorized model.",
    }


@app.get("/v1/models")
async def models() -> dict[str, Any]:
    return {
        "ollama": await ollama_models(),
        "transformers": transformers_status(),
        "transformers_default_model": DEFAULT_TRANSFORMERS_MODEL,
        "loaded_transformer_models": list(_transformer_cache.keys()),
    }


@app.post("/v1/run")
async def run(request: RunRequest) -> dict[str, Any]:
    if request.provider == "transformers":
        status = transformers_status()
        if not all(status.values()):
            raise HTTPException(status_code=501, detail="Transformers runtime is not installed yet.")
        model_id = request.model or DEFAULT_TRANSFORMERS_MODEL
        started = time.perf_counter()
        try:
            import torch
            tokenizer, model = load_transformer(model_id)
            messages: list[dict[str, str]] = []
            if request.system_prompt:
                messages.append({"role": "system", "content": request.system_prompt.strip()})
            messages.append({"role": "user", "content": request.prompt})
            if getattr(tokenizer, "chat_template", None):
                rendered_prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
            else:
                prefix = f"{request.system_prompt.strip()}\n\n" if request.system_prompt else ""
                rendered_prompt = prefix + request.prompt
            inputs = tokenizer(rendered_prompt, return_tensors="pt")
            with torch.inference_mode():
                output_ids = model.generate(
                    **inputs,
                    max_new_tokens=request.max_new_tokens,
                    do_sample=request.temperature > 0,
                    temperature=max(request.temperature, 0.01),
                    pad_token_id=tokenizer.eos_token_id,
                )
            generated = output_ids[0][inputs["input_ids"].shape[1]:]
            response_text = tokenizer.decode(generated, skip_special_tokens=True).strip()
        except Exception as error:
            raise HTTPException(status_code=502, detail=f"Transformers run failed for {model_id}: {error}") from error
        latency_ms = round((time.perf_counter() - started) * 1000)
        prompt_tokens = int(inputs["input_ids"].shape[1])
        completion_tokens = int(generated.shape[0])
        return {
            "provider": "transformers",
            "model": model_id,
            "response": response_text,
            "metrics": {"total_latency_ms": latency_ms, "prompt_tokens": prompt_tokens, "completion_tokens": completion_tokens, "total_tokens": prompt_tokens + completion_tokens},
            "provenance": {"engine": "synth-python-transformers", "engine_version": APP_VERSION, "device": "cpu", "model_loaded_in_process": True},
        }

    started = time.perf_counter()
    payload = {
        "model": request.model,
        "prompt": request.prompt,
        "system": request.system_prompt,
        "stream": False,
        "options": {"temperature": request.temperature},
    }
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPError as error:
        raise HTTPException(status_code=503, detail=f"Ollama run failed: {error}") from error

    latency_ms = round((time.perf_counter() - started) * 1000)
    prompt_tokens = data.get("prompt_eval_count")
    completion_tokens = data.get("eval_count")
    return {
        "provider": "ollama",
        "model": request.model,
        "response": data.get("response", ""),
        "metrics": {
            "total_latency_ms": latency_ms,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "total_tokens": (prompt_tokens or 0) + (completion_tokens or 0),
        },
        "provenance": {
            "engine": "synth-python-fastapi",
            "engine_version": APP_VERSION,
            "ollama_base_url": OLLAMA_BASE_URL,
        },
    }


@app.post("/v1/validate-packets")
async def validate_packets(request: ValidationRequest) -> dict[str, Any]:
    """Perform a structural preflight before data is reused for training."""
    required = {"schema", "id", "type", "input", "address", "integrityHash"}
    errors: list[dict[str, Any]] = []
    for index, record in enumerate(request.records):
        missing = sorted(required.difference(record.keys()))
        if missing:
            errors.append({"index": index, "missing": missing})
            continue
        if record.get("schema") != "synth.packet.v1":
            errors.append({"index": index, "issue": "unsupported schema"})
        if record.get("metadata", {}).get("syntheticOutput"):
            errors.append({"index": index, "issue": "simulator output cannot be training evidence"})
    return {
        "valid": not errors,
        "records_checked": len(request.records),
        "errors": errors,
        "note": "This checks structure and stated provenance, not factual correctness or licensing.",
    }
