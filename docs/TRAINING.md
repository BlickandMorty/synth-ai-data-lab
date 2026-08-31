# From SYNTH preference data to a guarded DPO trial

SYNTH currently builds the dataset and reviews its basic structural readiness.
It does not automatically train anything from the web interface.

## The point of the gate

A preference pair is one person saying which of two matching answers is better,
and why. It is not enough data to demonstrate that a model got better. SYNTH
requires 20 eligible pairs before a small local prototype can even be considered.
For serious post-training, collect a much larger reviewed set and use a GPU.

## Prepare the export

In Dataset Review, export **eligible preference pairs JSONL**, then run:

```powershell
.\engine\.venv\Scripts\python.exe .\engine\prepare_dpo_dataset.py .\synth-preference-pairs.jsonl .\data\synth-dpo.jsonl
```

The script creates the DPO JSONL plus a manifest showing the count and whether
the data meets the minimum. Review both before doing anything else.

## Inspect a training plan

```powershell
.\engine\.venv\Scripts\python.exe .\engine\train_dpo.py .\data\synth-dpo.jsonl
```

This is a dry run. It does not alter a model.

## Explicit CPU prototype

Only after you have enough authorized, reviewed pairs and have inspected the
plan, a slow CPU proof-of-workflow run is available:

```powershell
.\engine\.venv\Scripts\python.exe .\engine\train_dpo.py .\data\synth-dpo.jsonl --train --allow-cpu
```

The output is a LoRA adapter, not a replacement base model. Treat it as an
experiment: compare it to the original model on held-out prompts and record
the evaluation in SYNTH.
