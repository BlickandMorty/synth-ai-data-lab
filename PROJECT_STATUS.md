# SYNTH V1 status

SYNTH is a local-first data and evaluation lab. It is not a hosted training
service and it does not claim to update model weights.

## What is working now

- Run an installed local Ollama model from the Lab.
- Save the submitted prompt as one packet and the completion as a child packet.
- Give each packet a stable UAS-style address and SHA-256 integrity digest.
- Group packets under a user-created experiment journal.
- Review two outputs in the annotation studio and save a preference decision.
- Export raw packets or human-reviewed, non-simulator preference pairs as JSONL.

## Evidence checked locally on 2026-08-31

- Ollama was reachable and listed three installed Qwen3 4B local models.
- A real Qwen3 4B completion was returned through the application in about 8 seconds.
- A human preference pair made from two real local completions exported as
  `synth.preference.v1` and did not include simulator output.

## Important limits

- The simulator exists only to test the interface when Ollama is unavailable.
  Simulator output is visibly labeled and excluded from preference exports.
- The current database is local SQLite. It is deliberately excluded from Git.
- Search, browser, and tool-call connectors are planned packet types; they are
  not implemented as live integrations in V1.
- A Python / Hugging Face sidecar is next, not claimed as complete.
