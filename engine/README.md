# SYNTH local research engine

This is the Python sidecar for SYNTH. It does not own the web app database;
the Next.js application remains the source of truth for packets and annotations.

## What it runs today

- Health and local-model discovery through Ollama.
- A reproducible local Ollama inference endpoint: `POST /v1/run`.
- Packet-structure preflight before a JSONL dataset is reused.

## What is intentionally not claimed yet

- It can run a small open Hugging Face model through the `transformers` provider.
  The default is `HuggingFaceTB/SmolLM2-135M-Instruct`, chosen because this
  laptop's installed PyTorch is CPU-only. Its first use downloads the model.
  Bigger models should stay in Ollama or wait for a GPU-capable setup.
- It does not fine-tune weights. SYNTH currently builds, reviews, and exports
  data needed for a later supervised fine-tune or preference-training run.

## Start it

```powershell
cd C:\Users\jojo\Projects\SYNTH
.\engine\.venv\Scripts\python.exe -m uvicorn engine.app.main:app --host 127.0.0.1 --port 8020
```

Then open `http://127.0.0.1:8020/docs` for the local API reference.
