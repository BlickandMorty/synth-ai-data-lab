# Why SYNTH uses TypeScript, Python, and UAS

SYNTH is one project with different jobs, not three competing stacks.

```text
Person using the lab
        |
        v
Next.js / TypeScript interface
  - experiments, packets, annotation, replay
  - local SQLite ledger
        |
        +-----------------------------+
        |                             |
        v                             v
Direct Ollama                   Python research engine
  - local Qwen runs               - Transformers and datasets
  - simple local path             - model/runtime preflight
                                  - later eval and fine-tuning jobs
        |
        v
UAS packet spine
  - address, content digest, integrity digest, parent link
```

## The practical decision

### TypeScript / Next.js owns the platform

The data lab is a product interface: it needs tables, forms, packet inspection,
annotation controls, links, exports, and a clear local dashboard. Next.js is a
better fit for that than trying to build a desktop shell or a Python-only UI
before the research workflow is proven.

### Python owns model research

Python is where Transformers, Datasets, Torch, Accelerate, model evaluation,
and later post-training tools live. The FastAPI engine is not a decorative
backend: it reports which local runtime executed a run and makes a clear place
for controlled model work to grow.

### Ollama is the stronger local default today

The installed Qwen3 4B models already provide useful local inference. The
Transformers adapter uses SmolLM2 135M because PyTorch is CPU-only on this
machine. It is there for reproducible small-model experiments, not because it
is presumed to be the strongest model available.

### UAS is a module, not a separate app

The Unified Address Space work becomes useful here as the record spine. A
packet gets a type, a content digest, a source family, a revision, and an
integrity digest. A completion also points to the prompt that produced it.
That is enough to ask later: “what exactly did I compare?” without pretending
that a hash proves a result is scientifically correct.

## What training means here

SYNTH does **not** update model weights in V1. It creates the data and checks
needed before a responsible training attempt:

1. Define a narrow question and failure condition in an experiment journal.
2. Run one or more local models with recorded parameters.
3. Compare matching outputs from the exact same prompt.
4. Save a human review with scores and a reason.
5. Export real, non-simulator preference pairs as JSONL.
6. Validate packet structure and provenance before a later fine-tune/DPO job.

SYNTH now has the local TRL and PEFT packages installed, but its readiness
check deliberately keeps a small CPU prototype behind a 20-pair minimum and
serious post-training behind a larger reviewed dataset and a GPU. This is a
guardrail against calling a test run a research result.

That is related to RLHF/post-training, but it is the data-collection and
evaluation half—not a claim that SYNTH has already trained a better model.

## When Rust or a Windows companion makes sense

Epistemos Windows remains its own native research workspace. A SYNTH native
component should be added only after the web workflow shows a specific need,
such as a local background capture agent, high-throughput packet storage, or a
secure native bridge. Starting there would slow down the actual research loop.
