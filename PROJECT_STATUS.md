# SYNTH V1 status

SYNTH is a local-first data and evaluation lab. It is not a hosted training
service and it does not claim to update model weights.

## What is working now

- Run an installed local Ollama model from the Lab.
- Save the submitted prompt as one packet and the completion as a child packet.
- Give each packet a stable UAS-style address and SHA-256 integrity digest.
- Group packets under a user-created experiment journal.
- Review two outputs in the annotation studio and save a preference decision.
- Surface unreviewed, eligible matching-prompt completion pairs in an annotation queue;
  reviewed pairs are not re-offered as fresh preference data.
- Export raw packets or human-reviewed, non-simulator preference pairs as JSONL.
- Use the local Python FastAPI engine for Ollama runs with explicit engine provenance.
- Run a small CPU-friendly open Transformers model (`SmolLM2 135M`) through the engine.
- Run a bounded, sequential comparison between local Ollama and Transformers targets under one experiment.
- Capture user-supplied external context as typed packets (for example search-query,
  tool-call, red-team, or causal-trace context) without pretending that SYNTH has a
  live connector for that source.
- Create formal experiment runs and replay a saved prompt from an experiment detail page.
- Summarize the local human review signal for an experiment: review count,
  preference decisions, and per-rubric averages.
- Preflight a local export, produce a reproducible manifest, and use a guarded
  local DPO-preparation workflow. The training gate rejects datasets that are too
  small and does not claim a trained model exists.

## Evidence checked locally on 2026-08-31

- Ollama was reachable and listed three installed Qwen3 4B local models.
- A real Qwen3 4B completion was returned through the application in about 8 seconds.
- A real SmolLM2 135M Transformers completion was returned through the Python
  engine and then through the web packet route.
- A mixed-provider comparison produced two non-simulator completion packets:
  Qwen3 through Ollama and SmolLM2 through the Python Transformers adapter.
- A human preference pair made from two real local completions exported as
  `synth.preference.v1` and did not include simulator output.

## Important limits

- The simulator exists only to test the interface when Ollama is unavailable.
  Simulator output is visibly labeled and excluded from preference exports.
- The current database is local SQLite. It is deliberately excluded from Git.
- Search, browser, and tool-call connectors are not live integrations in V1.
  Typed external context may be captured manually so its source and limits stay
  visible in the experiment record.
- The installed PyTorch runtime is CPU-only. Larger Transformers experiments
  should use Ollama or wait for a GPU-capable setup.
