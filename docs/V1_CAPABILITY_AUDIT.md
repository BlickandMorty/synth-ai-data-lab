# SYNTH V1 capability audit

This is a boundary document for the working local V1. It separates verified
capabilities from the work that still needs real human judgment or more
resources.

## Verified capabilities

| Requested capability | Evidence in SYNTH | Status |
|---|---|---|
| Minimal local web lab | Next.js application with RetroGaming only on heading styling and SN Pro/Geist body typography | Working locally |
| Open/local model experiments | Ollama Qwen3 and CPU Transformers paths in the Data Lab | Working locally |
| Prompt and response capture | Each run creates linked prompt and completion packets with latency, token estimates, parameters, and hashes | Working locally |
| External context capture | Packet Explorer captures typed search/tool/red-team/research context with source locator and optional experiment link | Working locally, manual capture only |
| Human preference review | Annotation Studio validates matching real completion pairs and saves rubric/preference records | Working locally |
| Review queue | Eligible, unreviewed real pairs appear automatically; simulator outputs are excluded | Working locally |
| Replayable research journal | Experiment runs retain packets and restore model/settings into the Data Lab before a replay | Working locally |
| UAS implementation link | Packet address fields implement `kind / content digest / source family / revision`; UAS bridge is documented in its own repository | Working locally |
| Dataset export/checks | JSONL exports, manifest, local preflight, and post-training readiness gates | Working locally |
| Canon project home | Research System page explains the relationship to the selected repositories and can show public GitHub activity | Working locally |

## Deliberate limits

- SYNTH records manually entered external context. It does not silently scrape
  browser activity or independently validate a URL.
- Simulator outputs exist only for UI failure handling. They are visibly marked
  and excluded from eligible preference exports and the review queue.
- A local annotation is reviewer signal, not a benchmark score or proof of model
  capability.
- The installed PyTorch runtime is CPU-only. SYNTH can prepare a reviewed DPO
  dataset locally, but it does not claim weights have been trained.
- No cloud APIs, cloud GPUs, or paid hosting are required for the working V1.

## What must happen before real post-training

This step cannot be automated honestly:

1. Run meaningful matched prompts across real local targets.
2. Read both answers and write independent review notes; do not auto-fill
   preferences just to reach a count.
3. Collect enough reviewed, licensed, non-sensitive pairs to satisfy the local
   readiness gate.
4. Run preflight and inspect the exported manifest.
5. Use the guarded DPO preparation/training scripts in `docs/TRAINING.md` only
   when the data and machine are actually ready.

The current next action is simple: open `/annotate`, review the queued real
comparison, and save only the judgment you actually believe.
