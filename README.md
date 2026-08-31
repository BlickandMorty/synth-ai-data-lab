# SYNTH

SYNTH is a local-first AI data lab for turning model interactions into reviewable training records.

It is built for the work between "I ran a prompt" and "I have data I can trust enough to use": keeping prompts, responses, search queries, comparisons, annotations, parameters, latency, and provenance together.

## What V1 does

- Runs a prompt against an Ollama model on this machine, or makes an explicitly labeled simulator record when Ollama is unavailable.
- Saves prompts, completions, comparisons, and review notes in local SQLite.
- Gives each packet a UAS-style address: `kind / content digest / source family / revision`.
- Adds an integrity digest so a review can identify the exact record it refers to.
- Supports a side-by-side annotation flow with rubric scores, preference choice, flaw tags, and written justification.
- Runs a bounded, sequential two-model comparison under one experiment journal, including Ollama ↔ Transformers comparisons on this CPU machine.
- Groups records into experiment journals so a personal model-internals, scientific-reasoning, UAS, or security exercise can be replayed instead of becoming a loose folder of screenshots.

## What V1 does not claim

SYNTH does not train a model's weights yet. It collects the supervised and preference data that would be needed before a real fine-tuning, DPO, or other post-training run.

The simulator is for interface and annotation testing only. Its output is labeled in both the packet metadata and the interface; it is not evidence from a local model.

The lab is for synthetic, public, or explicitly authorized material. Do not add secrets, classified information, real client data, health records, or sensitive operational material.

## Why this stack

The interface is Next.js/React/TypeScript because it needs a practical multi-page application, local SQLite, tables, review tools, and a clean deployment story. Python belongs beside it as the research engine: Hugging Face Transformers, dataset export, evaluation scripts, and later fine-tuning. Rust can power focused performance-sensitive local components later, but it should not slow down the first real workflow.

## Local setup

One time on this machine, the complete web and Python research stack is set up with:

```powershell
cd C:\Users\jojo\Projects\SYNTH
.\scripts\setup-synth.ps1
```

Start both local services with:

```powershell
.\scripts\start-synth.ps1
```

That opens the web lab at `http://127.0.0.1:3018` and the Python engine API reference at `http://127.0.0.1:8020/docs`.

- Direct Ollama: installed Qwen3 4B variants.
- Python engine + Ollama: the same Qwen model with engine provenance.
- Python Transformers: `HuggingFaceTB/SmolLM2-135M-Instruct`, a CPU-friendly open model downloaded on first use. It is useful for small controlled tests, not a replacement for a larger GPU model.

## UAS inside SYNTH

Unified Address Space is not a separate app here. It is the packet spine.

```text
Experiment -> Run -> Packet -> Annotation
                         |
                         +-> UAS address + integrity digest
```

This lets a prompt, model output, annotation, search query, or future transformer activation trace keep its type and history when it moves between experiments.

For the full technology and research decision, see [Architecture](docs/ARCHITECTURE.md).

For the guarded DPO preparation and training workflow, see [Training](docs/TRAINING.md).

## V1 routes

- `/` - dashboard
- `/lab` - run and log a local model prompt
- `/api/compare` - sequentially run the same prompt across two to four selected local targets
- `/annotate` - compare outputs and save a review
- `/packets` - inspect packet addresses, content, and integrity digests
- `/experiments` - create and view replayable experiment journals
- `/settings` - see local Ollama and storage status

## Next milestones

1. Packet export to JSONL for supervised fine-tuning and preference data.
2. Run comparison mode: same prompt, multiple local models, one shared packet family.
3. A review queue with assigned annotation tasks and packet-level disagreement summaries.
4. Published experiment cards that expose method and limits but keep personal raw data local.
5. A minimal Windows companion only after the web workflow proves what native functionality is actually worth building.

## Local configuration

Copy `.env.example` to `.env.local` if the Ollama service is not using its default endpoint.
