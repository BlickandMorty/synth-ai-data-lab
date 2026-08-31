# SYNTH

SYNTH is a local-first AI data lab for turning model interactions into reviewable training records.

It is built for the work between "I ran a prompt" and "I have data I can trust enough to use": keeping prompts, responses, search queries, comparisons, annotations, parameters, latency, and provenance together.

## What V1 does

- Runs a prompt against an Ollama model on this machine, or makes an explicitly labeled simulator record when Ollama is unavailable.
- Saves prompts, completions, comparisons, and review notes in local SQLite.
- Gives each packet a UAS-style address: `kind / content digest / source family / revision`.
- Adds an integrity digest so a review can identify the exact record it refers to.
- Supports a side-by-side annotation flow with rubric scores, preference choice, flaw tags, and written justification.
- Maintains an eligible annotation queue: it proposes only unreviewed pairs of real, matching-prompt completions from different local targets. Reviewed pairs do not reappear as new training examples.
- Runs a bounded, sequential two-model comparison under one experiment journal, including Ollama ↔ Transformers comparisons on this CPU machine.
- Groups records into experiment journals so a personal model-internals, scientific-reasoning, UAS, or security exercise can be replayed instead of becoming a loose folder of screenshots.
- Captures typed external context manually (for example a search query, tool call, or red-team note) as a packet when you need it in an experiment. This is deliberate capture, not a hidden browser integration.
- Preflights local packets and exports reproducible JSONL snapshots with manifests before any post-training workflow.
- Shows experiment-level human review counts, preference decisions, and rubric averages while clearly labeling those summaries as reviewer signal rather than objective capability scores.

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
- `/projects` - the research-system map: how SYNTH connects to the small canon of active projects without claiming they are all one application
- `/datasets` - review export eligibility, preflight local data, and check post-training readiness
- `/settings` - see local Ollama and storage status

## Next milestones

1. A review queue that makes it easier to collect enough independent, written human judgments for a meaningful dataset.
2. Optional live browser/tool connectors with explicit consent and clear source capture, rather than hidden collection.
3. Published experiment cards that expose method, limits, and aggregate results while personal raw data remains local.
4. A small report generator for experiment methods, packet counts, reviewer signal, and dataset manifests.
5. A minimal Windows companion only after the web workflow proves what native functionality is actually worth building.

## Research-system map

SYNTH is the evidence layer for a deliberately small canon of projects, rather than an attempt to make every repository look equally mature. It can document tests for Epistemos, the Unified Address Space idea, Scientific Reasoning Audit Loops, LivingBrain, Instant Recall, and synthetic Security Operations exercises. The in-app `/projects` page explains the boundary for each one: whether it is the research workspace, a provenance principle, a separate project under evaluation, or a safe synthetic evaluation domain.

## Local configuration

Copy `.env.example` to `.env.local` if the Ollama service is not using its default endpoint.
